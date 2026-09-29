import { DOCUMENT } from '@angular/common';
import { inject } from '@angular/core';
import { HandshakeMessage as BffHandshakeMessage } from '@shared/messages/bff-to-client/app/handshake-message';
import { HandshakeMessage as ClientHandshakeMessage } from '@shared/messages/client-to-bff/app/handshake-message';
import { ClientToBffMessage } from '@shared/messages/client-to-bff/client-to-bff-message';
import { MessageData } from '@shared/messages/message';
import { filter, Subject } from 'rxjs';
import { PLATFORM } from '../platforms/platform';
import { WINDOW } from '../tokens/window';

const CLIENT_RELOAD_SAFETY_MARGIN_MS = 10_000;

/**
 * Базовый транспорт. Управляет токеном, очередью сообщений
 * и реконнектом через жизненный цикл вкладки.
 *
 * Когда вкладка уходит в фон, long-lived соединение часто рвётся.
 * Реконнект в этот момент бессмыслен: пользователь не на странице,
 * а страница может перезагрузиться.
 *
 * Стратегия (детали — в наследниках):
 * - в фоне — запоминаем, что нужен реконнект, и останавливаем попытки;
 * - при возврате на вкладку — переподключаемся;
 * - bfcache (pageshow + persisted) — соединение мёртво, JS-состояние на месте.
 */
export abstract class Source {
  readonly connect$ = new Subject<void>();
  readonly disconnect$ = new Subject<void>();
  readonly incomingMessage$: Subject<MessageData> = new Subject(); // MessageData потому что сообщение еще не прошло парсинг, поэтому нельзя использовать instanceof
  readonly outcomingMessage$: Subject<ClientToBffMessage> = new Subject();
  token?: string;
  protected clientDestroyTimeoutMs?: number;
  pendingMessages: ClientToBffMessage[] = [];
  /** true = соединение упало неожиданно и нужно восстановить, когда можно */
  protected wantsReconnect = false;
  private disconnectedAt?: number;
  private document = inject(DOCUMENT);
  private window = inject(WINDOW, { optional: true });
  private platform = inject(PLATFORM);

  private readonly onVisibilityChange = () => {
    if (this.isTabVisible()) {
      this.onTabVisible();
    } else {
      this.onTabHidden();
    }
  };

  private readonly onPageShow = (event: PageTransitionEvent) => {
    if (event.persisted) {
      this.onTabRestoredFromCache();
    }
  };

  constructor() {
    this.incomingMessage$
      .pipe(
        filter(
          (message): message is BffHandshakeMessage =>
            message.type === BffHandshakeMessage.type &&
            typeof (message as BffHandshakeMessage).payload?.token === 'string',
        ),
      )
      .subscribe((message) => {
        this.token = message.payload.token;
        this.clientDestroyTimeoutMs = message.payload.clientDestroyTimeoutMs;
        this.flushPendingMessages();
      });
    this.connect$.subscribe(() => {
      void this.sendClientHandshakeIfNeeded();
      this.flushPendingMessages();
    });
    this.bindTabLifecycle();
  }

  protected canSendWithoutToken(message: ClientToBffMessage): boolean {
    return message instanceof ClientHandshakeMessage;
  }

  protected canSendMessage(message: ClientToBffMessage): boolean {
    return (
      this.connected() && (!!this.token || this.canSendWithoutToken(message))
    );
  }

  private async sendClientHandshakeIfNeeded() {
    if (this.token) {
      return;
    }

    const applicationId = await this.platform.applicationId();
    this.outcomingMessage$.next(new ClientHandshakeMessage({ applicationId }));
  }

  private flushPendingMessages() {
    if (!this.connected()) {
      return;
    }

    const remaining: ClientToBffMessage[] = [];
    for (const message of this.pendingMessages) {
      if (this.canSendMessage(message)) {
        this.outcomingMessage$.next(message);
      } else {
        remaining.push(message);
      }
    }
    this.pendingMessages = remaining;
  }

  protected isTabVisible(): boolean {
    return this.document.visibilityState === 'visible';
  }

  protected bindTabLifecycle() {
    if (!this.window) {
      return;
    }

    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.window.addEventListener('pageshow', this.onPageShow);
  }

  protected unbindTabLifecycle() {
    if (!this.window) {
      return;
    }

    this.document.removeEventListener(
      'visibilitychange',
      this.onVisibilityChange,
    );
    this.window.removeEventListener('pageshow', this.onPageShow);
  }

  /** Вкладка снова видима — пробуем восстановить соединение */
  protected onTabVisible(): void {
    this.reconnectIfNeeded();
  }

  /** Вкладка ушла в фон — наследник решает, как остановить соединение */
  protected abstract onTabHidden(): void;

  /** Страница восстановилась из bfcache без reload */
  protected onTabRestoredFromCache(): void {
    this.wantsReconnect = true;
    this.reconnectIfNeeded();
  }

  protected reconnectIfNeeded(): void {
    if (!this.wantsReconnect || this.connected()) {
      return;
    }

    const reconnectDeadlineMs =
      this.clientDestroyTimeoutMs != null
        ? Math.max(
            this.clientDestroyTimeoutMs - CLIENT_RELOAD_SAFETY_MARGIN_MS,
            0,
          )
        : undefined;
    if (
      this.window &&
      this.disconnectedAt != null &&
      reconnectDeadlineMs != null &&
      Date.now() - this.disconnectedAt >= reconnectDeadlineMs
    ) {
      // Перезагружаем страницу чуть раньше серверного destroy, чтобы не тратить
      // round-trip на reconnect, который все равно закончится командой reload.
      this.window.location.reload();
      return;
    }

    this.beforeReconnect();
    this.connect();
  }

  /** Хук перед connect() при реконнекте */
  protected beforeReconnect(): void {}

  protected markConnected(): void {
    this.wantsReconnect = false;
    delete this.disconnectedAt;
  }

  protected markNeedsReconnect(): void {
    this.wantsReconnect = true;
    if (this.disconnectedAt == null) {
      this.disconnectedAt = Date.now();
    }
  }

  /** Штатное отключение — сбрасываем флаги и снимаем слушатели */
  protected teardown(): void {
    this.wantsReconnect = false;
    this.unbindTabLifecycle();
  }

  abstract disconnect(): void;
  abstract connect(): void;
  abstract connected(): boolean;
}
