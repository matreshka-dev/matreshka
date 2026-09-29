import { MessageData } from "../message";
import { BffToGatewayMessage } from "./bff-to-gateway-message";
import { bffToGatewayMessageRegistry } from "./bff-to-gateway-message-registry";

export function parseBffToGatewayMessage(
  data: MessageData,
): BffToGatewayMessage {
  const messageClass = bffToGatewayMessageRegistry.findByType(data.type);
  if (!messageClass) {
    throw new Error(`Message type ${data.type} not registered`);
  }

  return new messageClass(data.payload);
}
