import { ReliableTargetedBffToClientMessage } from "../reliable-bff-to-client-message";
type ContextInitMessagePayload = Record<string, unknown>;
export declare class ContextInitMessage extends ReliableTargetedBffToClientMessage<Record<string, unknown>> {
    readonly payload: ContextInitMessagePayload;
    static readonly type = "context-init";
    constructor(target: string, payload: ContextInitMessagePayload);
}
export {};
