import { MessageReceivedPayload } from "../reliable-message";
import { BffToClientMessage } from "./bff-to-client-message";
export declare class BffToClientMessageReceivedMessage extends BffToClientMessage<MessageReceivedPayload> {
    readonly payload: MessageReceivedPayload;
    static readonly type = "message-received";
    constructor(payload: MessageReceivedPayload);
}
