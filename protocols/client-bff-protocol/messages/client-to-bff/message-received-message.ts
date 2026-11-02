import { MessageReceivedPayload } from "../reliable-message";
import { ClientToBffMessage } from "./client-to-bff-message";

export class ClientToBffMessageReceivedMessage extends ClientToBffMessage<MessageReceivedPayload> {
  static readonly type = "message-received";

  constructor(public override readonly payload: MessageReceivedPayload) {
    super(payload);
  }
}
