import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
export declare class DisablePrivacyModeMessage extends PingableTargetedBffToClientMessage<undefined> {
    readonly target: string;
    static readonly type = "disable-privacy-mode";
    constructor(target: string);
}
