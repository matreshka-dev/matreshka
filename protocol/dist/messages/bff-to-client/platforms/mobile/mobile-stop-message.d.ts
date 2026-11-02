import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export declare class MobileStopMessage extends PingableTargetedBffToClientMessage<undefined> {
    readonly target: string;
    static readonly type = "stop";
    constructor(target: string);
}
