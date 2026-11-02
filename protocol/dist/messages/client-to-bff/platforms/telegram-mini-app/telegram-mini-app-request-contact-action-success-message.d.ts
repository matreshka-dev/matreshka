import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";
export declare class TelegramMiniAppRequestContactActionSuccessMessage extends PingableTargetedClientToBffMessage<unknown> {
    readonly target: string;
    readonly payload: unknown;
    static readonly type = "telegram-mini-app-platform-request-contact-action-success";
    constructor(target: string, payload: unknown);
}
