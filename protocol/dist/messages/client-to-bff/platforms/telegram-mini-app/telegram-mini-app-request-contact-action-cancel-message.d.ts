import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";
export declare class TelegramMiniAppRequestContactActionCancelMessage extends PingableTargetedClientToBffMessage<{}> {
    readonly target: string;
    static readonly type = "telegram-mini-app-platform-request-contact-action-cancel";
    constructor(target: string);
}
