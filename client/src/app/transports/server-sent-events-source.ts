import { HttpClient } from '@angular/common/http';
import { inject } from '@angular/core';
import { BffToClientMessage } from '@shared/messages/bff-to-client/bff-to-client-message';
import { EVENT_SOURCE } from '../tokens/event-source';
import { Source } from './source';

/**
 * SSE-транспорт.
 *
 * EventSource сам переподключается при обрыве, пока не вызван close().
 * Стратегия:
 * - вкладка скрыта — явно закрываем EventSource, останавливаем auto-reconnect;
 * - вкладка снова видима — создаём новое подключение;
 * - при видимой вкладке и обрыве сети — полагаемся на встроенный реконнект браузера.
 */
export class ServerSentEventsSource extends Source {
  private eventSource?: EventSource;
  private http = inject(HttpClient);
  eventSourceClass = inject(EVENT_SOURCE);

  constructor(
    private params: { eventsUrl: string; sendingMessagesUrl: string },
  ) {
    super();
    this.outcomingMessage$.subscribe((message) => {
      if (this.canSendMessage(message)) {
        this.http
          .post(
            this.params.sendingMessagesUrl,
            { message: JSON.stringify(message) },
            {
              headers: this.token ? { Authorization: this.token } : undefined,
            },
          )
          .subscribe();
      } else {
        this.pendingMessages.push(message);
      }
    });
  }

  connect() {
    console.log(`Init connection ` + this.params.eventsUrl);
    this.closeEventSource();

    const params: Record<string, string> = {};
    if (this.token) {
      params['token'] = this.token;
    }
    const eventSource = (this.eventSource = new this.eventSourceClass(
      this.params.eventsUrl + '?' + new URLSearchParams(params),
    ));

    eventSource.addEventListener('open', () => {
      this.markConnected();
      this.connect$.next();
    });

    eventSource.addEventListener('message', (event) => {
      this.incomingMessage$.next(JSON.parse(event.data) as BffToClientMessage);
    });

    eventSource.addEventListener('error', () => {
      console.log('Unknown event source error');
      this.disconnect$.next();
      // При видимой вкладке браузер сам переподключит EventSource.
      // В фоне reconnect остановлен через onTabHidden().
    });
  }

  override connected(): boolean {
    return this.eventSource?.readyState === this.eventSourceClass.OPEN;
  }

  override disconnect() {
    this.teardown();
    this.closeEventSource();
  }

  protected override onTabHidden(): void {
    this.pauseConnection();
  }

  /** Закрываем соединение в фоне, чтобы браузер не делал auto-reconnect впустую */
  private pauseConnection() {
    if (!this.eventSource) {
      return;
    }

    const { CONNECTING, OPEN } = this.eventSourceClass;
    const state = this.eventSource.readyState;
    if (state === OPEN || state === CONNECTING) {
      this.markNeedsReconnect();
      this.closeEventSource();
      this.disconnect$.next();
    }
  }

  private closeEventSource() {
    this.eventSource?.close();
    delete this.eventSource;
  }
}
