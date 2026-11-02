import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
export type PlatformSetColorSchemeMode = "light" | "dark" | "system";
export type PlatformSetColorSchemePayload = {
    mode: PlatformSetColorSchemeMode;
};
export declare class PlatformSetColorSchemeMessage extends PingableTargetedBffToClientMessage<PlatformSetColorSchemePayload> {
    readonly target: string;
    readonly payload: PlatformSetColorSchemePayload;
    static readonly type = "platform-set-color-scheme";
    constructor(target: string, payload: PlatformSetColorSchemePayload);
}
