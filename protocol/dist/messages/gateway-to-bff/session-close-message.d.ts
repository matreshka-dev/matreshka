import { GatewayToBffMessage } from "./gateway-to-bff-message";
export type SessionClosePayload = {
    sessionId: string;
};
export declare class SessionCloseMessage extends GatewayToBffMessage<SessionClosePayload> {
    readonly payload: SessionClosePayload;
    static readonly type = "session-close";
    constructor(payload: SessionClosePayload);
}
