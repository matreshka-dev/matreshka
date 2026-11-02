import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type BrowserDownloadCsvContentPayload = {
    filename: string;
    content: string[][];
};
export declare class BrowserDownloadCsvContentMessage extends PingableTargetedBffToClientMessage<BrowserDownloadCsvContentPayload> {
    readonly target: string;
    readonly payload: BrowserDownloadCsvContentPayload;
    static readonly type = "browser-download-csv-content";
    constructor(target: string, payload: BrowserDownloadCsvContentPayload);
}
