import { Subject, type Observable } from "rxjs";
import type { BffConnection } from "./bff-connection";
import type { GatewayInternals } from "./gateway-internals";

/** Клиентская сессия gateway. */
export class ClientConnection {
  private readonly outgoingToClientSubject = new Subject<string>();
  private readonly disconnectSubject = new Subject<void>();
  private bffLink?: BffConnection;
  private closed = false;

  /** Исходящие сообщения клиенту (opaque JSON string). */
  readonly outgoingToClient$: Observable<string> =
    this.outgoingToClientSubject.asObservable();
  /** Сессия закрыта gateway или transport-адаптером. */
  readonly disconnect$: Observable<void> =
    this.disconnectSubject.asObservable();

  constructor(
    private readonly gateway: GatewayInternals,
    readonly id: string,
    readonly reconnectToken?: string,
  ) {
    if (reconnectToken) {
      const target = this.gateway.lookupReconnectTarget(reconnectToken);
      if (target) {
        this.gateway.linkClientToBff(this, target.bff, target.reconnectToken);
      }
    }
  }

  /** BFF, обслуживающий эту сессию; `undefined` до client handshake или reconnect. */
  get bff(): BffConnection | undefined {
    return this.bffLink;
  }

  /**
   * Обрабатывает входящее сообщение от клиента.
   *
   * Первое сообщение новой сессии должно быть client handshake.
   */
  handleMessage(message: string): void {
    if (this.closed) {
      return;
    }

    this.gateway.routeClientMessage(this, message);
  }

  /** Закрывает сессию и отвязывает от BFF. */
  close(): void {
    if (this.closed) {
      return;
    }

    this.gateway.closeClient(this);
  }

  /** @internal */
  attachBff(bff: BffConnection): void {
    this.bffLink = bff;
  }

  /** @internal */
  detachBff(): void {
    this.bffLink = undefined;
  }

  /** @internal */
  send(message: string): void {
    this.outgoingToClientSubject.next(message);
  }

  /** @internal */
  markDisconnected(): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.detachBff();
    this.gateway.onClientUnregistered(this);
    this.disconnectSubject.next();
    this.disconnectSubject.complete();
    this.outgoingToClientSubject.complete();
  }
}
