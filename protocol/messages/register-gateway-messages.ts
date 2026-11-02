import { BffMessage } from "./bff-to-gateway/bff-message";
import { bffToGatewayMessageRegistry } from "./bff-to-gateway/bff-to-gateway-message-registry";
import { ClientMessage } from "./gateway-to-bff/client-message";
import { ConnectedMessage } from "./gateway-to-bff/connected-message";
import { ErrorMessage } from "./gateway-to-bff/error-message";
import { gatewayToBffMessageRegistry } from "./gateway-to-bff/gateway-to-bff-message-registry";
import { SessionCloseMessage } from "./gateway-to-bff/session-close-message";
import { SessionOpenMessage } from "./gateway-to-bff/session-open-message";

let registered = false;

/** Регистрирует типы сообщений gateway ↔ BFF. Безопасно вызывать повторно. */
export function registerGatewayMessages(): void {
  if (registered) {
    return;
  }

  gatewayToBffMessageRegistry.register(ConnectedMessage);
  gatewayToBffMessageRegistry.register(SessionOpenMessage);
  gatewayToBffMessageRegistry.register(ClientMessage);
  gatewayToBffMessageRegistry.register(SessionCloseMessage);
  gatewayToBffMessageRegistry.register(ErrorMessage);

  bffToGatewayMessageRegistry.register(BffMessage);

  registered = true;
}
