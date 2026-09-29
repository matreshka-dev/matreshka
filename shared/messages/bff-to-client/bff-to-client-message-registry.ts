import { MessageRegistry } from "../message-registry";
import {
  BffToClientMessage,
  TargetedBffToClientMessage,
} from "./bff-to-client-message";

export const bffToClientMessageRegistry = new MessageRegistry<
  BffToClientMessage<any> | TargetedBffToClientMessage<any>
>();
