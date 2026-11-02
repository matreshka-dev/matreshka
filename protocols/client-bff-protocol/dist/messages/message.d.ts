export type MessageData = {
    type: string;
    payload?: unknown;
    id?: string;
    attempt?: number;
};
export type IncomingMessageData = MessageData & {
    target?: string;
    handlers?: number[];
};
export declare abstract class Message<PAYLOAD = unknown> {
    readonly payload?: PAYLOAD | undefined;
    get type(): string;
    constructor(payload?: PAYLOAD | undefined);
    toJSON(): MessageData;
}
