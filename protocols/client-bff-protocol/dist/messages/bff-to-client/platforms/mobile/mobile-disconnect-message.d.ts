import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type MobileDisconnectPayload = {
    deviceId: string;
};
export declare class MobileDisconnectMessage extends PingableTargetedBffToClientMessage<MobileDisconnectPayload> {
    readonly target: string;
    readonly payload: MobileDisconnectPayload;
    static readonly type = "disconnect";
    constructor(target: string, payload: MobileDisconnectPayload);
}
