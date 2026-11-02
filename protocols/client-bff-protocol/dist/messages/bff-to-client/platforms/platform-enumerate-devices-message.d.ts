import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
export declare class PlatformEnumerateDevicesMessage extends PingableTargetedBffToClientMessage<undefined> {
    readonly target: string;
    static readonly type = "platform-enumerate-devices";
    constructor(target: string);
}
