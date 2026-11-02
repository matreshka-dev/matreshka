import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type MobileGetBleServicesPayload = {
    deviceId: string;
};
export declare class MobileGetBleServicesMessage extends PingableTargetedBffToClientMessage<MobileGetBleServicesPayload> {
    readonly target: string;
    readonly payload: MobileGetBleServicesPayload;
    static readonly type = "get-ble-services";
    constructor(target: string, payload: MobileGetBleServicesPayload);
}
