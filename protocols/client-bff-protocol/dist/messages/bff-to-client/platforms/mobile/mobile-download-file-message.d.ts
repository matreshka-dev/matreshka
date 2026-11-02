import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type MobileDownloadFilePayload = {
    url: string;
    filename: string;
};
export declare class MobileDownloadFileMessage extends PingableTargetedBffToClientMessage<MobileDownloadFilePayload> {
    readonly target: string;
    readonly payload: MobileDownloadFilePayload;
    static readonly type = "mobile-download-file";
    constructor(target: string, payload: MobileDownloadFilePayload);
}
