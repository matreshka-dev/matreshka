import { GatewayToBffMessage } from "./gateway-to-bff-message";
export type SessionOpenPayload = {
    sessionId: string;
    reconnectToken?: string;
};
export declare class SessionOpenMessage extends GatewayToBffMessage<SessionOpenPayload> {
    readonly payload: SessionOpenPayload;
    static readonly type = "session-open";
    constructor(payload: SessionOpenPayload);
}
