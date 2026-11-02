import { MessageReceivedPayload } from "../reliable-message";
import { ClientToBffMessage } from "./client-to-bff-message";
export declare class ClientToBffMessageReceivedMessage extends ClientToBffMessage<MessageReceivedPayload> {
    readonly payload: MessageReceivedPayload;
    static readonly type = "message-received";
    constructor(payload: MessageReceivedPayload);
}
