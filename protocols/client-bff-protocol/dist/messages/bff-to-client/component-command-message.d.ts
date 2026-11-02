import { BffToClientMessage } from "./bff-to-client-message";
import { PingableComponentCommandMessage } from "./pingable-component-command-message";
import { ReliableComponentCommandMessage } from "./reliable-component-command-message";
export type ComponentCommandActionPayload = {
    actionScope: string;
};
export { PingableComponentCommandMessage, ReliableComponentCommandMessage };
export type ComponentCommandMessage = PingableComponentCommandMessage | ReliableComponentCommandMessage;
export declare function isComponentCommandMessage(message: BffToClientMessage): message is ComponentCommandMessage;
