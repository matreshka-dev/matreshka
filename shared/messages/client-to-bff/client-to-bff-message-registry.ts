import { MessageRegistry } from "../message-registry";
import {
  ClientToBffMessage,
  TargetedClientToBffMessage,
} from "./client-to-bff-message";

export const clientToBffMessageRegistry = new MessageRegistry<
  ClientToBffMessage<any> | TargetedClientToBffMessage<any>
>();
