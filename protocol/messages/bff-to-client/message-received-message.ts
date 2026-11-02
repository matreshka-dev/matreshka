import { MessageReceivedPayload } from "../reliable-message";
import { BffToClientMessage } from "./bff-to-client-message";

export class BffToClientMessageReceivedMessage extends BffToClientMessage<MessageReceivedPayload> {
  static readonly type = "message-received";

  constructor(public override readonly payload: MessageReceivedPayload) {
    super(payload);
  }
}
