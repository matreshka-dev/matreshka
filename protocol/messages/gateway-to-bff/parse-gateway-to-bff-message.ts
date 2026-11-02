import { MessageData } from "../message";
import { GatewayToBffMessage } from "./gateway-to-bff-message";
import { gatewayToBffMessageRegistry } from "./gateway-to-bff-message-registry";

export function parseGatewayToBffMessage(
  data: MessageData,
): GatewayToBffMessage {
  const messageClass = gatewayToBffMessageRegistry.findByType(data.type);
  if (!messageClass) {
    throw new Error(`Message type ${data.type} not registered`);
  }

  return new messageClass(data.payload);
}
