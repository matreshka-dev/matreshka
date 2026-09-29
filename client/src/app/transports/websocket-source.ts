import { inject } from '@angular/core';
import { BffToClientMessage } from '@shared/messages/bff-to-client/bff-to-client-message';
import { Subscription, timer } from 'rxjs';
import { WEB_SOCKET } from '../tokens/web-socket';
import { Source } from './source';

/**
 * WebSocket-транспорт.
 *
 * Стратегия реконнекта:
 * - в фоне — только запоминаем, что нужен реконнект;
 * - при возврате на вкладку — переподключаемся;
 * - при видимой вкладке и обрыве сети — retry каждые N мс.
 */
export class WebsocketSource extends Source {
  private socket?: WebSocket;
  private reconnectInterval?: Subscription;
  /** true только если close инициировал сам клиент через {@link disconnect} */
  private closedByClient = false;
  webSocketClass = inject(WEB_SOCKET);

  constructor(private params: { url: string }) {
    super();
    this.outcomingMessage$.subscribe((message) => {
      if (this.canSendMessage(message)) {
        this.socket!.send(JSON.stringify(message));
      } else {
        this.pendingMessages.push(message);
      }
    });
  }

  connect() {
    if (
      this.socket?.readyState === this.webSocketClass.CONNECTING ||
      this.socket?.readyState === this.webSocketClass.OPEN
    ) {
      return;
    }

    console.log(`Init connection ` + this.params.url);
    this.closedByClient = false;
    const params: Record<string, string> = {};
    if (this.token) {
      params['token'] = this.token;
    }
    this.socket = new this.webSocketClass(
      this.params.url + '?' + new URLSearchParams(params),
    );

    // Обработчики вешаем сразу: handshake может не успеть открыться
    // (сервер ещё поднимается после рестарта), и тогда onclose внутри
    // onopen никогда не сработает — retry остановится навсегда.
    this.socket.onopen = () => {
      this.markConnected();
      this.clearReconnectInterval();
      this.connect$.next();
    };

    this.socket.onmessage = (event) => {
      this.incomingMessage$.next(JSON.parse(event.data) as BffToClientMessage);
    };

    this.socket.onerror = (event) => {
      console.log('Unknown websocket error', event);
    };

    this.socket.onclose = (event) => {
      console.log(`Socket close with code = ${event.code}`);
      this.disconnect$.next();

      // Штатное закрытие через disconnect() — реконнект не нужен.
      // Код 1000 сам по себе не значит, что закрыл клиент: при рестарте
      // процесса сервер тоже часто закрывает сокеты с 1000.
      if (this.closedByClient) {
        return;
      }

      this.markNeedsReconnect();

      // Вкладка скрыта — откладываем реконнект до visibilitychange или pageshow.
      // Если страница перезагрузится, подключение создаст новый экземпляр класса.
      if (!this.isTabVisible()) {
        return;
      }

      // Вкладка видима, но сеть отвалилась — пробуем сразу и каждые N мс
      this.scheduleReconnect();
    };
  }

  connected() {
    return this.socket?.readyState === this.webSocketClass.OPEN;
  }

  disconnect() {
    this.teardown();
    this.clearReconnectInterval();
    this.closedByClient = true;
    if (this.socket) {
      this.socket.close(1000);
    }
  }

  protected override onTabHidden(): void {
    this.clearReconnectInterval();
  }

  /** Fallback: повторные попытки каждые N мс, пока вкладка видима */
  private scheduleReconnect() {
    if (this.reconnectInterval) {
      return;
    }

    this.reconnectInterval = timer(0, 500).subscribe(() => {
      if (this.isTabVisible()) {
        this.reconnectIfNeeded();
      }
    });
  }

  private clearReconnectInterval() {
    this.reconnectInterval?.unsubscribe();
    delete this.reconnectInterval;
  }
}
