import { MessageRegistry } from "../message-registry";
import { BffToClientMessage, TargetedBffToClientMessage } from "./bff-to-client-message";
export declare const bffToClientMessageRegistry: MessageRegistry<BffToClientMessage<any> | TargetedBffToClientMessage<any>>;
