import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";
export type AppStorageValuePayload = {
    key: string;
    value: string | undefined;
};
export declare class AppStorageValueMessage extends PingableBffToClientMessage<AppStorageValuePayload> {
    readonly payload: AppStorageValuePayload;
    static readonly type = "storage-value";
    constructor(payload: AppStorageValuePayload);
}
