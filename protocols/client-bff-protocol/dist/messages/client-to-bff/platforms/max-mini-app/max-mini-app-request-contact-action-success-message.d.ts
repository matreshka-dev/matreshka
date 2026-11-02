import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";
export declare class MaxMiniAppRequestContactActionSuccessMessage extends PingableTargetedClientToBffMessage<unknown> {
    readonly target: string;
    readonly payload: unknown;
    static readonly type = "max-mini-app-platform-request-contact-action-success";
    constructor(target: string, payload: unknown);
}
