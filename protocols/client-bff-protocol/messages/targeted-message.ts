import { Message, MessageData } from "./message";

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
