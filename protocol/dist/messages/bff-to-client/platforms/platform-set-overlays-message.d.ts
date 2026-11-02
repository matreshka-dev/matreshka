import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
export type PlatformSetOverlaysPayload = {
    overlays: unknown[];
};
export declare class PlatformSetOverlaysMessage extends PingableTargetedBffToClientMessage<PlatformSetOverlaysPayload> {
    readonly target: string;
    readonly payload: PlatformSetOverlaysPayload;
    static readonly type = "platform-set-overlays";
    constructor(target: string, payload: PlatformSetOverlaysPayload);
}
