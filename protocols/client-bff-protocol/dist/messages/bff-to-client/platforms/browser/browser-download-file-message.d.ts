import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type BrowserDownloadFilePayload = {
    url: string;
    filename: string;
};
export declare class BrowserDownloadFileMessage extends PingableTargetedBffToClientMessage<BrowserDownloadFilePayload> {
    readonly target: string;
    readonly payload: BrowserDownloadFilePayload;
    static readonly type = "browser-download-file";
    constructor(target: string, payload: BrowserDownloadFilePayload);
}
