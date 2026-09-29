import { MessageRegistry } from "../message-registry";
import { BffToGatewayMessage } from "./bff-to-gateway-message";

export const bffToGatewayMessageRegistry = new MessageRegistry<
  BffToGatewayMessage<any>
>();
