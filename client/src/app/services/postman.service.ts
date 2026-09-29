import { Injectable } from '@angular/core';
import { BffToClientMessage } from '@shared/messages/bff-to-client/bff-to-client-message';
import { BffToClientMessageReceivedMessage } from '@shared/messages/bff-to-client/message-received-message';
import { parseBffToClientMessage } from '@shared/messages/bff-to-client/parse-bff-to-client-message';
import { ClientToBffMessage } from '@shared/messages/client-to-bff/client-to-bff-message';
import { ClientToBffMessageReceivedMessage } from '@shared/messages/client-to-bff/message-received-message';
import { ReliableDelivery } from '@shared/messages/reliable-delivery';
import { BehaviorSubject, Observable, Subject, takeUntil } from 'rxjs';
import { ServerSentEventsSource } from '../transports/server-sent-events-source';
import { Source } from '../transports/source';
import { WebsocketSource } from '../transports/websocket-source';
import { SourceConfig } from '../types/source-config';

@Injectable({
  providedIn: 'root',
})
/**
 * Сервис для управления соединением с сервером, отправкой
 * и получением сообщений, берет на себя ситуации, когда
 * соединение с сервером еще не открыто или если сервер сменился
 */
export class PostmanService {
  private source?: Source;
  private detach$ = new Subject<void>();
  private incomingMessageSubject = new Subject<BffToClientMessage>();
  private reliableDelivery?: ReliableDelivery<
    BffToClientMessage,
    ClientToBffMessage
  >;
  /**
   * Входящие сообщения от сервера.
   * Снаружи доступен только Observable, чтобы внешние классы
   * могли только подписываться, но не эмитить сообщения.
   */
  incomingMessage$: Observable<BffToClientMessage> =
    this.incomingMessageSubject.asObservable();
  outcomingMessage$ = new Subject<ClientToBffMessage>();
  ping$ = new BehaviorSubject<number | undefined>(undefined);

  constructor() {
    this.ping$.subscribe((ping) => {
      console.debug('ping', ping);
    });
  }

  detachSource() {
    this.detach$.next();
    this.reliableDelivery?.destroy();
    this.ping$.next(undefined);
    const source = this.source;
    delete this.reliableDelivery;
    delete this.source;
    return source?.disconnect();
  }

  attachSource(source: SourceConfig) {
    this.detachSource();
    switch (source.type) {
      case 'ws':
        this.source = new WebsocketSource(source.params);
        break;
      case 'sse':
        this.source = new ServerSentEventsSource(source.params);
        break;
      default:
        throw new Error(`${source} transport not supported`);
    }

    this.reliableDelivery = new ReliableDelivery<
      BffToClientMessage,
      ClientToBffMessage
    >({
      emitOutgoing: (message) => this.outcomingMessage$.next(message),
      createReceipt: (payload) =>
        new ClientToBffMessageReceivedMessage(payload),
      isReceiptMessage: (message) =>
        message instanceof BffToClientMessageReceivedMessage,
      ping$: this.ping$,
    });

    this.source.incomingMessage$
      .pipe(takeUntil(this.detach$))
      .subscribe((data) => {
        const message = parseBffToClientMessage(data);
        const nextMessage = this.reliableDelivery!.handleIncoming(message);
        if (nextMessage) {
          this.incomingMessageSubject.next(nextMessage);
        }
      });

    this.outcomingMessage$
      .pipe(takeUntil(this.detach$))
      .subscribe((message) => {
        this.reliableDelivery!.observeOutgoing(message);
        this.source!.outcomingMessage$.next(message);
      });

    this.source.connect();
  }
}
