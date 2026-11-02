import { MessageRegistry } from "../message-registry";
import { GatewayToBffMessage } from "./gateway-to-bff-message";

export const gatewayToBffMessageRegistry = new MessageRegistry<
  GatewayToBffMessage<any>
>();
