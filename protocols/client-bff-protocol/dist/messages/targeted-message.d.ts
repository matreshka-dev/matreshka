import { Message, MessageData } from "./message";
export type TargetedMessageData = MessageData & {
    target: string;
};
export declare abstract class TargetedMessage<PAYLOAD = unknown> extends Message<PAYLOAD> {
    readonly target: string;
    constructor(target: string, payload?: PAYLOAD);
    toJSON(): TargetedMessageData;
}
