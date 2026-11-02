import { MessageData } from "../message";
import { ReliableMessageData, ReliableTargetedMessageData } from "../reliable-message";
import { BffToClientMessage, TargetedBffToClientMessage } from "./bff-to-client-message";
export declare abstract class ReliableBffToClientMessage<PAYLOAD = unknown> extends BffToClientMessage<PAYLOAD> {
    private _id?;
    private _attempt?;
    get id(): string;
    get attempt(): number;
    nextAttempt(): number;
    restoreDelivery(data: MessageData): void;
    toJSON(): ReliableMessageData;
}
export declare abstract class ReliableTargetedBffToClientMessage<PAYLOAD = unknown> extends TargetedBffToClientMessage<PAYLOAD> {
    private _id?;
    private _attempt?;
    get id(): string;
    get attempt(): number;
    nextAttempt(): number;
    restoreDelivery(data: MessageData): void;
    toJSON(): ReliableTargetedMessageData;
}
export declare function isReliableBffToClientMessage(message: unknown): message is ReliableBffToClientMessage | ReliableTargetedBffToClientMessage;
