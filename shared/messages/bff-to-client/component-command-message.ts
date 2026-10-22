import { BffToClientMessage } from "./bff-to-client-message";
import { PingableComponentCommandMessage } from "./pingable-component-command-message";
import { ReliableComponentCommandMessage } from "./reliable-component-command-message";

/** Поле correlation ack для pingable component commands (в wire — внутри `payload`). */
export type ComponentCommandActionPayload = {
  actionScope: string;
};

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
