import { ReliableTargetedClientToBffMessage } from "../reliable-client-to-bff-message";
export type ClientContextInitPayload = Record<string, unknown>;
export declare class ContextInitMessage extends ReliableTargetedClientToBffMessage<ClientContextInitPayload> {
    readonly payload: ClientContextInitPayload;
    static readonly type = "context-init";
    constructor(target: string, payload?: ClientContextInitPayload);
}
