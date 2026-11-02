import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
export type PlatformNativePickerInputType = "color" | "date" | "time" | "datetime-local";
export type PlatformShowNativePickerPayload = {
    component_id: string;
    inputType: PlatformNativePickerInputType;
    ref: string;
};
export declare class PlatformShowNativePickerMessage extends PingableTargetedBffToClientMessage<PlatformShowNativePickerPayload> {
    readonly target: string;
    readonly payload: PlatformShowNativePickerPayload;
    static readonly type = "platform-show-native-picker";
    constructor(target: string, payload: PlatformShowNativePickerPayload);
}
