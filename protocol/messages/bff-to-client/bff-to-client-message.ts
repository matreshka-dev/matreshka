import { Message } from "../message";
import { TargetedMessage } from "../targeted-message";

export abstract class BffToClientMessage<
  PAYLOAD = unknown,
> extends Message<PAYLOAD> {
  constructor(payload?: PAYLOAD) {
    super(payload);
  }
}

export abstract class TargetedBffToClientMessage<
  PAYLOAD = unknown,
> extends TargetedMessage<PAYLOAD> {
  constructor(target: string, payload?: PAYLOAD) {
    super(target, payload);
  }
}

export type AnyBffToClientMessage =
  | BffToClientMessage
  | TargetedBffToClientMessage;
