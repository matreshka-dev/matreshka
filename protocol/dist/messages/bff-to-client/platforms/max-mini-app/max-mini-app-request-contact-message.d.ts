import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export declare class MaxMiniAppRequestContactMessage extends PingableTargetedBffToClientMessage<undefined> {
    readonly target: string;
    static readonly type = "max-mini-app-request-contact";
    constructor(target: string);
}
