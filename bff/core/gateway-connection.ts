import { BffMessage } from "@matreshka/shared/messages/bff-to-gateway/bff-message";
import { ClientMessage } from "@matreshka/shared/messages/gateway-to-bff/client-message";
import { ConnectedMessage } from "@matreshka/shared/messages/gateway-to-bff/connected-message";
import { ErrorMessage } from "@matreshka/shared/messages/gateway-to-bff/error-message";
import { parseGatewayToBffMessage } from "@matreshka/shared/messages/gateway-to-bff/parse-gateway-to-bff-message";
import { SessionCloseMessage } from "@matreshka/shared/messages/gateway-to-bff/session-close-message";
import { SessionOpenMessage } from "@matreshka/shared/messages/gateway-to-bff/session-open-message";
import { registerGatewayMessages } from "@matreshka/shared/messages/register-gateway-messages";
import { Subject, type Subscription } from "rxjs";
import WebSocket from "ws";
import { Client } from "./client";
import type { ClientSettingsResolver, Matreshka } from "./matreshka";
import { version as bffVersion } from "./version";

export type ConnectGatewayInput = {
  url: string;
  token: string;
  resolveClientSettings: ClientSettingsResolver;
};

/** WebSocket-подключение BFF к gateway. */
export class GatewayConnection {
  private readonly socket: WebSocket;
  private readonly sessions = new Map<string, Client>();
  private readonly subscriptions: Subscription[] = [];
  private readonly resolveClientSettings: ClientSettingsResolver;
  private closed = false;

  readonly connected$ = new Subject<void>();
  readonly disconnected$ = new Subject<void>();
  readonly error$ = new Subject<unknown>();

  constructor(
    private readonly matreshka: Matreshka,
    input: ConnectGatewayInput,
  ) {
    registerGatewayMessages();
    this.resolveClientSettings = input.resolveClientSettings;

    this.socket = new WebSocket(
      buildGatewayWebSocketUrl(input.url, input.token),
    );
    this.bindSocketEvents();
  }

  disconnect(): void {
    if (this.closed) {
      return;
    }

    this.closed = true;
    this.socket.close();
  }

  private bindSocketEvents(): void {
    this.socket.on("open", () => {
      // Ждём ConnectedMessage от gateway.
    });

    this.socket.on("message", (data: WebSocket.RawData) => {
      try {
        this.handleGatewayMessage(data.toString());
      } catch (error) {
        this.error$.next(error);
      }
    });

    this.socket.on("error", (error) => {
      this.error$.next(error);
    });

    this.socket.on("close", () => {
      this.closeAllSessions();
      this.unsubscribeAll();
      this.disconnected$.next();
      this.disconnected$.complete();
      this.connected$.complete();
      this.error$.complete();
    });
  }

  private handleGatewayMessage(raw: string): void {
    const message = parseGatewayToBffMessage(JSON.parse(raw));

    if (message instanceof ConnectedMessage) {
      this.connected$.next();
      return;
    }

    if (message instanceof ErrorMessage) {
      this.error$.next(new Error(message.payload.message));
      this.disconnect();
      return;
    }

    if (message instanceof SessionOpenMessage) {
      this.openSession(message);
      return;
    }

    if (message instanceof ClientMessage) {
      this.sessions
        .get(message.payload.sessionId)
        ?.newMessage(message.payload.message);
      return;
    }

    if (message instanceof SessionCloseMessage) {
      this.closeSession(message.payload.sessionId);
    }
  }

  private openSession(message: SessionOpenMessage): void {
    const { sessionId, reconnectToken } = message.payload;
    const params = new URLSearchParams();

    if (reconnectToken) {
      params.set("token", reconnectToken);
    }

    const client = this.matreshka.getClient(params);
    const errorSubscription = client.error$.subscribe((error) => {
      this.error$.next(error);
    });

    client.attachTransport((outgoing) => {
      this.sendToGateway(
        new BffMessage({
          sessionId,
          message: JSON.stringify(outgoing.toJSON()),
        }),
      );
    });

    this.sessions.set(sessionId, client);
    this.subscriptions.push(errorSubscription);
    this.matreshka.initClient(client, params, this.resolveClientSettings);
  }

  private closeSession(sessionId: string): void {
    const client = this.sessions.get(sessionId);
    if (!client) {
      return;
    }

    client.detachTransport();
    this.matreshka.clientDisconnect$.next(client);
    this.sessions.delete(sessionId);
  }

  private closeAllSessions(): void {
    for (const sessionId of [...this.sessions.keys()]) {
      this.closeSession(sessionId);
    }
  }

  private sendToGateway(message: BffMessage): void {
    if (this.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    this.socket.send(JSON.stringify(message.toJSON()));
  }

  private unsubscribeAll(): void {
    for (const subscription of this.subscriptions) {
      subscription.unsubscribe();
    }
    this.subscriptions.length = 0;
  }
}

export function buildGatewayWebSocketUrl(
  serverUrl: string,
  token: string,
): string {
  const url = new URL(serverUrl);

  if (url.pathname === "/" || url.pathname === "") {
    url.pathname = "/bff";
  }

  url.searchParams.set("token", token);
  url.searchParams.set("version", bffVersion);

  return url.toString();
}
