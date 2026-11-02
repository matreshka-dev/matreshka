import { ComponentInteractionMessage } from "../component-interaction-message";
export declare class CameraQrCodeMessage extends ComponentInteractionMessage<string> {
    static readonly type = "camera-qr-code";
    readonly eventType = "qr-code";
    constructor(target: string, payload: string);
}
