import { ReliableTargetedMessageData } from "../../reliable-message";
import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";
export type ComponentInteractionMessageData = ReliableTargetedMessageData & {
    handlers: number[];
};
export declare abstract class ComponentInteractionMessage<PAYLOAD = unknown> extends PingableTargetedClientToBffMessage<PAYLOAD> {
    abstract readonly eventType: string;
    private handlers;
    getHandlers(): number[];
    setHandlers(handlers: number[]): this;
    toJSON(): ComponentInteractionMessageData;
}
export declare function parseHandlers(value: unknown): number[];
