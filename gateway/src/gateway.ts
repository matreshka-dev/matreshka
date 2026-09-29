import { randomUUID } from "node:crypto";
import { BehaviorSubject, type Observable } from "rxjs";
import { parseBffToken } from "./auth/token";
import { BffConnection } from "./bff-connection";
import { ClientConnection } from "./client-connection";
import { APPLICATION_ID_MAP } from "./config/application-id-map";
import type {
  BffServerConfig,
  GatewayConfig,
} from "./config/bff-server-config";
import type { GatewayInternals } from "./gateway-internals";
import { extractBffHandshakeToken } from "./parse/bff-handshake-token";
import { parseClientHandshake } from "./parse/client-handshake";
import { TokenRegistry } from "./routing/token-registry";
import type {
  ActiveBffInfo,
  ConnectBffInput,
  ConnectBffResult,
  OpenClientSessionOptions,
} from "./types";

/**
 * Transport-agnostic hub для пересылки сообщений между клиентами и BFF.
 *
 * Transport-адаптер клиента вызывает `connectClient`; BFF регистрируется через
 * `connectBff`. Инстансы {@link ClientConnection} и {@link BffConnection}
 * связываются при маршрутизации по client handshake или reconnect token.
 */
export class Gateway implements GatewayInternals {
  private readonly bffConfigs = new Map<string, BffServerConfig>();
  private readonly activeBffs = new Map<string, BffConnection>();
  private readonly clients = new Map<string, ClientConnection>();
  private readonly tokenRegistry = new TokenRegistry();
  private readonly activeBffsSubject = new BehaviorSubject<ActiveBffInfo[]>([]);
  private readonly clientSessionCountSubject = new BehaviorSubject<number>(0);

  readonly activeBffs$: Observable<ActiveBffInfo[]> =
    this.activeBffsSubject.asObservable();
  readonly clientSessionCount$: Observable<number> =
    this.clientSessionCountSubject.asObservable();

  constructor(config: GatewayConfig) {
    for (const server of config.bffServers) {
      this.bffConfigs.set(server.id, { ...server });
    }
    this.emitActiveBffs();
  }

  addBffServerConfig(config: BffServerConfig): void {
    this.bffConfigs.set(config.id, { ...config });
  }

  updateBffServerConfig(id: string, patch: Partial<BffServerConfig>): void {
    const current = this.bffConfigs.get(id);
    if (!current) {
      throw new Error(`BFF server "${id}" is not configured`);
    }
    this.bffConfigs.set(id, { ...current, ...patch, id });
  }

  removeBffServerConfig(id: string): void {
    this.bffConfigs.delete(id);
    this.activeBffs.get(id)?.disconnect();
  }

  connectBff(input: ConnectBffInput): ConnectBffResult {
    const parsed = parseBffToken(input.token);
    if (!parsed) {
      return { ok: false, error: "Invalid BFF token format" };
    }

    const config = this.bffConfigs.get(parsed.id);
    if (!config || config.secret !== parsed.secret) {
      return { ok: false, error: "Unknown BFF or invalid credentials" };
    }

    this.activeBffs.get(parsed.id)?.disconnect();

    const bff = new BffConnection(
      this,
      config,
      input.version,
      Date.now(),
      this.applicationIdsFor(config),
    );

    this.activeBffs.set(parsed.id, bff);
    this.emitActiveBffs();

    return { ok: true, bff };
  }

  connectClient(options: OpenClientSessionOptions = {}): ClientConnection {
    const client = new ClientConnection(
      this,
      randomUUID(),
      options.reconnectToken,
    );
    this.clients.set(client.id, client);
    this.onClientRegistered(client);
    return client;
  }

  resolveBffForApplicationId(applicationId: string): BffConnection | undefined {
    for (const [bffId, config] of this.bffConfigs.entries()) {
      const bff = this.activeBffs.get(bffId);
      if (!bff) {
        continue;
      }

      const applicationIds = this.applicationIdsFor(config);
      if (applicationIds.includes(applicationId)) {
        return bff;
      }
    }

    return undefined;
  }

  lookupReconnectTarget(reconnectToken: string) {
    const entry = this.tokenRegistry.lookup(reconnectToken);
    if (!entry) {
      return undefined;
    }

    const bff = this.activeBffs.get(entry.bffId);
    if (!bff) {
      return undefined;
    }

    return { bff, reconnectToken };
  }

  linkClientToBff(
    client: ClientConnection,
    bff: BffConnection,
    reconnectToken?: string,
  ): void {
    bff.linkClient(client, reconnectToken);
  }

  routeClientMessage(client: ClientConnection, message: string): void {
    if (!client.bff) {
      const handshake = parseClientHandshake(message);
      if (!handshake) {
        return;
      }

      const bff = this.resolveBffForApplicationId(handshake.applicationId);
      if (!bff) {
        client.close();
        return;
      }

      this.linkClientToBff(client, bff);
    }

    const bff = client.bff;
    if (!bff) {
      return;
    }

    bff.forwardClientMessage(client, message);
  }

  deliverBffMessageToClient(client: ClientConnection, message: string): void {
    const clientToken = extractBffHandshakeToken(message);
    if (clientToken && client.bff) {
      this.tokenRegistry.register(clientToken, {
        bffId: client.bff.id,
        sessionId: client.id,
      });
    }

    client.send(message);
  }

  closeClient(client: ClientConnection): void {
    if (!this.clients.has(client.id)) {
      return;
    }

    this.clients.delete(client.id);
    this.tokenRegistry.removeBySession(client.id);

    client.bff?.unlinkClient(client);
    client.markDisconnected();
    this.clientSessionCountSubject.next(this.clients.size);
  }

  disconnectBffConnection(bff: BffConnection): void {
    if (!this.activeBffs.has(bff.id)) {
      return;
    }

    this.activeBffs.delete(bff.id);
    this.tokenRegistry.removeByBff(bff.id);
    bff.markDisconnected();
    this.emitActiveBffs();
  }

  onClientRegistered(client: ClientConnection): void {
    this.clientSessionCountSubject.next(this.clients.size);
  }

  onClientUnregistered(_client: ClientConnection): void {
    this.clientSessionCountSubject.next(this.clients.size);
  }

  onBffRegistered(_bff: BffConnection): void {
    this.emitActiveBffs();
  }

  onBffUnregistered(_bff: BffConnection): void {
    this.emitActiveBffs();
  }

  private applicationIdsFor(config: BffServerConfig): readonly string[] {
    return config.applicationIds ?? APPLICATION_ID_MAP[config.id] ?? [];
  }

  private emitActiveBffs(): void {
    const list: ActiveBffInfo[] = [...this.activeBffs.values()].map((bff) => ({
      id: bff.id,
      version: bff.version,
      applicationIds: bff.applicationIds,
      connectedAt: bff.connectedAt,
    }));
    this.activeBffsSubject.next(list);
  }
}
