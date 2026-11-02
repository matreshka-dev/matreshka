import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type MobileDiscoverBleServicesPayload = {
    deviceId: string;
};
export declare class MobileDiscoverBleServicesMessage extends PingableTargetedBffToClientMessage<MobileDiscoverBleServicesPayload> {
    readonly target: string;
    readonly payload: MobileDiscoverBleServicesPayload;
    static readonly type = "discover-ble-services";
    constructor(target: string, payload: MobileDiscoverBleServicesPayload);
}
