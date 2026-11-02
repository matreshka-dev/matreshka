import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type TelegramMiniAppDownloadFilePayload = {
    url: string;
    filename: string;
};
export declare class TelegramMiniAppDownloadFileMessage extends PingableTargetedBffToClientMessage<TelegramMiniAppDownloadFilePayload> {
    readonly target: string;
    readonly payload: TelegramMiniAppDownloadFilePayload;
    static readonly type = "telegram-mini-app-download-file";
    constructor(target: string, payload: TelegramMiniAppDownloadFilePayload);
}
