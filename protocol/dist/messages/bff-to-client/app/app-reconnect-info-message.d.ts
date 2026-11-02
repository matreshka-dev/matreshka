import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";
export type AppReconnectInfoPayload = {
    serverInstanceId: string;
};
export declare class AppReconnectInfoMessage extends PingableBffToClientMessage<AppReconnectInfoPayload> {
    readonly payload: AppReconnectInfoPayload;
    static readonly type = "reconnect-info";
    constructor(payload: AppReconnectInfoPayload);
}
