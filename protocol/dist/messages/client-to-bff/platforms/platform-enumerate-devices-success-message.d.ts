import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";
export type PlatformEnumeratedDeviceKind = "audioinput" | "audiooutput" | "videoinput";
export type PlatformEnumeratedDevice = {
    kind: PlatformEnumeratedDeviceKind;
    deviceId: string;
    groupId: string;
    label?: string;
    capabilities?: Record<string, unknown>;
    settings?: Record<string, unknown>;
};
export type PlatformEnumerateDevicesSuccessPayload = {
    devices: PlatformEnumeratedDevice[];
};
export declare class PlatformEnumerateDevicesSuccessMessage extends PingableTargetedClientToBffMessage<PlatformEnumerateDevicesSuccessPayload> {
    readonly target: string;
    readonly payload: PlatformEnumerateDevicesSuccessPayload;
    static readonly type = "platform-enumerate-devices-success";
    constructor(target: string, payload: PlatformEnumerateDevicesSuccessPayload);
}
