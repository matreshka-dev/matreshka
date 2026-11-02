import { GatewayToBffMessage } from "./gateway-to-bff-message";
export type ClientMessagePayload = {
    sessionId: string;
    message: string;
};
export declare class ClientMessage extends GatewayToBffMessage<ClientMessagePayload> {
    readonly payload: ClientMessagePayload;
    static readonly type = "client-message";
    constructor(payload: ClientMessagePayload);
}
