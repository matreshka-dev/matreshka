import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type BrowserOpenFilePayload = {
    url: string;
};
export declare class BrowserOpenFileMessage extends PingableTargetedBffToClientMessage<BrowserOpenFilePayload> {
    readonly target: string;
    readonly payload: BrowserOpenFilePayload;
    static readonly type = "browser-open-file";
    constructor(target: string, payload: BrowserOpenFilePayload);
}
