import { IncomingMessageData } from "../message";
import { isTargetedMessageClass } from "../targeted-message";
import { bffToClientMessageRegistry } from "./bff-to-client-message-registry";
import { isReliableBffToClientMessage } from "./reliable-bff-to-client-message";

export function parseBffToClientMessage(data: IncomingMessageData) {
  const messageClass = bffToClientMessageRegistry.findByType(data.type);
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

  if (isReliableBffToClientMessage(message)) {
    message.restoreDelivery(data);
  }

  return message;
}
