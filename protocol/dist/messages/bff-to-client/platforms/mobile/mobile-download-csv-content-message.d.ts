import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type MobileDownloadCsvContentPayload = {
    filename: string;
    content: string[][];
};
export declare class MobileDownloadCsvContentMessage extends PingableTargetedBffToClientMessage<MobileDownloadCsvContentPayload> {
    readonly target: string;
    readonly payload: MobileDownloadCsvContentPayload;
    static readonly type = "mobile-download-csv-content";
    constructor(target: string, payload: MobileDownloadCsvContentPayload);
}
