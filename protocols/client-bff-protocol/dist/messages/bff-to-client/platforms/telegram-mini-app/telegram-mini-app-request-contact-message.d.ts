import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export declare class TelegramMiniAppRequestContactMessage extends PingableTargetedBffToClientMessage<undefined> {
    readonly target: string;
    static readonly type = "telegram-mini-app-request-contact";
    constructor(target: string);
}
