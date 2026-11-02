import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";
export type AppNavigatePayload = {
    path: string;
};
export declare class AppNavigateMessage extends PingableBffToClientMessage<AppNavigatePayload> {
    readonly payload: AppNavigatePayload;
    static readonly type = "navigate";
    constructor(payload: AppNavigatePayload);
}
