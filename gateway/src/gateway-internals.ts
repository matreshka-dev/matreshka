import type { BffConnection } from "./bff-connection";
import type { ClientConnection } from "./client-connection";

/** Внутренний контракт gateway для связанных Client/BFF инстансов. */
export type GatewayInternals = {
  resolveBffForApplicationId(applicationId: string): BffConnection | undefined;
  lookupReconnectTarget(
    reconnectToken: string,
  ): { bff: BffConnection; reconnectToken: string } | undefined;
  linkClientToBff(
    client: ClientConnection,
    bff: BffConnection,
    reconnectToken?: string,
  ): void;
  routeClientMessage(client: ClientConnection, message: string): void;
  deliverBffMessageToClient(client: ClientConnection, message: string): void;
  closeClient(client: ClientConnection): void;
  disconnectBffConnection(bff: BffConnection): void;
  onClientRegistered(client: ClientConnection): void;
  onClientUnregistered(client: ClientConnection): void;
  onBffRegistered(bff: BffConnection): void;
  onBffUnregistered(bff: BffConnection): void;
};
