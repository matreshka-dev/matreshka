import { Message } from "../message";
import { TargetedMessage } from "../targeted-message";
export declare abstract class BffToClientMessage<PAYLOAD = unknown> extends Message<PAYLOAD> {
    constructor(payload?: PAYLOAD);
}
export declare abstract class TargetedBffToClientMessage<PAYLOAD = unknown> extends TargetedMessage<PAYLOAD> {
    constructor(target: string, payload?: PAYLOAD);
}
export type AnyBffToClientMessage = BffToClientMessage | TargetedBffToClientMessage;
