import { MessageData } from "../message";
import { ReliableMessageData, ReliableTargetedMessageData } from "../reliable-message";
import { ClientToBffMessage, TargetedClientToBffMessage } from "./client-to-bff-message";
export declare abstract class ReliableClientToBffMessage<PAYLOAD = unknown> extends ClientToBffMessage<PAYLOAD> {
    private _id?;
    private _attempt?;
    get id(): string;
    get attempt(): number;
    nextAttempt(): number;
    restoreDelivery(data: MessageData): void;
    toJSON(): ReliableMessageData;
}
export declare abstract class ReliableTargetedClientToBffMessage<PAYLOAD = unknown> extends TargetedClientToBffMessage<PAYLOAD> {
    private _id?;
    private _attempt?;
    get id(): string;
    get attempt(): number;
    nextAttempt(): number;
    restoreDelivery(data: MessageData): void;
    toJSON(): ReliableTargetedMessageData;
}
export declare function isReliableClientToBffMessage(message: unknown): message is ReliableClientToBffMessage | ReliableTargetedClientToBffMessage;
