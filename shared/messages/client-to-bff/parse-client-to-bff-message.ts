import { IncomingMessageData } from "../message";
import { isTargetedMessageClass } from "../targeted-message";
import { clientToBffMessageRegistry } from "./client-to-bff-message-registry";
import {
  ComponentInteractionMessage,
  parseHandlers,
} from "./components/component-interaction-message";
import { isReliableClientToBffMessage } from "./reliable-client-to-bff-message";

export function parseClientToBffMessage(data: IncomingMessageData) {
  const messageClass = clientToBffMessageRegistry.findByType(data.type);
  if (!messageClass) {
    throw new Error(`Message type ${data.type} not registered`);
  }

  const message = isTargetedMessageClass(messageClass)
    ? (() => {
        if (typeof data.target !== "string") {
          throw new Error(
            `Message type ${data.type} requires target, got ${data.target}`,
          );
        }
        return new messageClass(data.target, data.payload);
      })()
    : new messageClass(data.payload);

  if (isReliableClientToBffMessage(message)) {
    message.restoreDelivery(data);
  }

  if (message instanceof ComponentInteractionMessage) {
    message.setHandlers(parseHandlers(data.handlers));
  }

  return message;
}
