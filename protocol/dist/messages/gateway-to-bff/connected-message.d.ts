import { GatewayToBffMessage } from "./gateway-to-bff-message";
export type ConnectedPayload = {
    bffId: string;
    applicationIds: readonly string[];
};
export declare class ConnectedMessage extends GatewayToBffMessage<ConnectedPayload> {
    readonly payload: ConnectedPayload;
    static readonly type = "connected";
    constructor(payload: ConnectedPayload);
}
