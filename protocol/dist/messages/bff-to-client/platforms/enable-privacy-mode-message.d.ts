import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
export declare class EnablePrivacyModeMessage extends PingableTargetedBffToClientMessage<undefined> {
    readonly target: string;
    static readonly type = "enable-privacy-mode";
    constructor(target: string);
}
