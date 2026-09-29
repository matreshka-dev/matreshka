import { BffToClientMessage } from "./bff-to-client-message";
import { PingableComponentCommandMessage } from "./pingable-component-command-message";
import { ReliableComponentCommandMessage } from "./reliable-component-command-message";

export { PingableComponentCommandMessage, ReliableComponentCommandMessage };

export type ComponentCommandMessage =
  | PingableComponentCommandMessage
  | ReliableComponentCommandMessage;

export function isComponentCommandMessage(
  message: BffToClientMessage,
): message is ComponentCommandMessage {
  return (
    message instanceof PingableComponentCommandMessage ||
    message instanceof ReliableComponentCommandMessage
  );
}
