import { ComponentInteractionMessage } from "../component-interaction-message";
export type CameraDeviceChangePayload = {
    deviceId: string;
};
export declare class CameraDeviceChangeMessage extends ComponentInteractionMessage<CameraDeviceChangePayload> {
    readonly target: string;
    readonly payload: CameraDeviceChangePayload;
    static readonly type = "camera-device-change";
    readonly eventType = "device-change";
    constructor(target: string, payload: CameraDeviceChangePayload);
}
