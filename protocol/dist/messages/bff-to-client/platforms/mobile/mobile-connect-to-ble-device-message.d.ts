import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type MobileConnectToBleDevicePayload = {
    deviceId: string;
    disconnectNotifyTarget: string;
};
export declare class MobileConnectToBleDeviceMessage extends PingableTargetedBffToClientMessage<MobileConnectToBleDevicePayload> {
    readonly target: string;
    readonly payload: MobileConnectToBleDevicePayload;
    static readonly type = "connect-to-ble-device";
    constructor(target: string, payload: MobileConnectToBleDevicePayload);
}
