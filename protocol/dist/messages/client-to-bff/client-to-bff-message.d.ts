import { Message } from "../message";
import { TargetedMessage } from "../targeted-message";
export declare abstract class ClientToBffMessage<PAYLOAD = unknown> extends Message<PAYLOAD> {
    constructor(payload?: PAYLOAD);
}
export declare abstract class TargetedClientToBffMessage<PAYLOAD = unknown> extends TargetedMessage<PAYLOAD> {
    constructor(target: string, payload?: PAYLOAD);
}
export type AnyClientToBffMessage = ClientToBffMessage | TargetedClientToBffMessage;
