import { BffToGatewayMessage } from "./bff-to-gateway-message";
export type BffMessagePayload = {
    sessionId: string;
    message: string;
};
export declare class BffMessage extends BffToGatewayMessage<BffMessagePayload> {
    readonly payload: BffMessagePayload;
    static readonly type = "bff-message";
    constructor(payload: BffMessagePayload);
}
