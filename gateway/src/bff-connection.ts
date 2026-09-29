import { Subject, type Observable } from "rxjs";
import type { ClientConnection } from "./client-connection";
import type { BffServerConfig } from "./config/bff-server-config";
import type { GatewayInternals } from "./gateway-internals";

export type BffClientOpenedEvent = {
  client: ClientConnection;
  reconnectToken?: string;
};

export type BffIncomingClientMessage = {
  client: ClientConnection;
  message: string;
};

/** Активное подключение BFF к gateway. */
export class BffConnection {
  private readonly clients = new Set<ClientConnection>();
  private readonly clientOpenedSubject = new Subject<BffClientOpenedEvent>();
  private readonly clientClosedSubject = new Subject<{
    client: ClientConnection;
  }>();
  private readonly incomingFromClientsSubject =
    new Subject<BffIncomingClientMessage>();
  private readonly disconnectSubject = new Subject<void>();
  private disconnected = false;

  /** Новая клиентская сессия или reconnect. */
  readonly clientOpened$: Observable<BffClientOpenedEvent> =
    this.clientOpenedSubject.asObservable();
  readonly clientClosed$: Observable<{ client: ClientConnection }> =
    this.clientClosedSubject.asObservable();
  /** Сообщение от привязанного клиента. */
  readonly incomingFromClients$: Observable<BffIncomingClientMessage> =
    this.incomingFromClientsSubject.asObservable();
  readonly disconnect$: Observable<void> =
    this.disconnectSubject.asObservable();

  constructor(
    private readonly gateway: GatewayInternals,
    readonly config: BffServerConfig,
    readonly version: string,
    readonly connectedAt: number,
    readonly applicationIds: readonly string[],
  ) {
    this.gateway.onBffRegistered(this);
  }

  readonly id = this.config.id;

  /** Клиентские сессии, привязанные к этому BFF. */
  get linkedClients(): readonly ClientConnection[] {
    return [...this.clients];
  }

  /** Отправляет сообщение клиенту через gateway. */
  sendToClient(client: ClientConnection | string, message: string): void {
    const target =
      typeof client === "string"
        ? [...this.clients].find((item) => item.id === client)
        : client;

    if (!target || target.bff !== this) {
      return;
    }

    this.gateway.deliverBffMessageToClient(target, message);
  }

  /** Отключает BFF и закрывает его клиентские сессии. */
  disconnect(): void {
    if (this.disconnected) {
      return;
    }

    this.gateway.disconnectBffConnection(this);
  }

  /** @internal */
  linkClient(client: ClientConnection, reconnectToken?: string): void {
    this.clients.add(client);
    client.attachBff(this);
    this.clientOpenedSubject.next({ client, reconnectToken });
  }

  /** @internal */
  unlinkClient(client: ClientConnection): void {
    if (!this.clients.delete(client)) {
      return;
    }

    client.detachBff();
    this.clientClosedSubject.next({ client });
  }

  /** @internal */
  forwardClientMessage(client: ClientConnection, message: string): void {
    if (!this.clients.has(client)) {
      return;
    }

    this.incomingFromClientsSubject.next({ client, message });
  }

  /** @internal */
  markDisconnected(): void {
    if (this.disconnected) {
      return;
    }

    this.disconnected = true;

    for (const client of [...this.clients]) {
      this.gateway.closeClient(client);
    }

    this.gateway.onBffUnregistered(this);
    this.disconnectSubject.next();
    this.disconnectSubject.complete();
    this.clientOpenedSubject.complete();
    this.clientClosedSubject.complete();
    this.incomingFromClientsSubject.complete();
  }
}
