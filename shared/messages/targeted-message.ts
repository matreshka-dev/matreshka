import { Message, MessageData } from "./message";
import type { MessageClass } from "./message-registry";

export type TargetedMessageData = MessageData & {
  target: string;
};

export abstract class TargetedMessage<
  PAYLOAD = unknown,
> extends Message<PAYLOAD> {
  constructor(
    readonly target: string,
    payload?: PAYLOAD,
  ) {
    super(payload);
  }

  override toJSON(): TargetedMessageData {
    return {
      ...super.toJSON(),
      target: this.target,
    };
  }
}

export function isTargetedMessage(
  message: unknown,
): message is TargetedMessage {
  return message instanceof TargetedMessage;
}

export function isTargetedMessageClass(
  messageClass: MessageClass<unknown>,
): boolean {
  let proto = messageClass.prototype as object | null;
  while (proto) {
    if (proto === TargetedMessage.prototype) {
      return true;
    }
    proto = Object.getPrototypeOf(proto);
  }
  return false;
}
