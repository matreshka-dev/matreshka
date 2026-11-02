import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type TelegramMiniAppSharePayload = {
    url?: string;
    title?: string;
    text?: string;
};
export declare class TelegramMiniAppShareMessage extends PingableTargetedBffToClientMessage<TelegramMiniAppSharePayload> {
    readonly target: string;
    readonly payload: TelegramMiniAppSharePayload;
    static readonly type = "telegram-mini-app-share";
    constructor(target: string, payload: TelegramMiniAppSharePayload);
}
