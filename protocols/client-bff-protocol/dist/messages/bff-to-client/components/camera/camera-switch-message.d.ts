import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export type CameraSwitchPayload = ComponentCommandActionPayload & {
    deviceId: string;
};
export declare class CameraSwitchMessage extends PingableComponentCommandMessage<CameraSwitchPayload> {
    readonly target: string;
    readonly payload: CameraSwitchPayload;
    static readonly type = "camera-switch";
    constructor(target: string, payload: CameraSwitchPayload);
}
