import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type BrowserSharePayload = {
    url?: string;
    title?: string;
    text?: string;
};
export declare class BrowserShareMessage extends PingableTargetedBffToClientMessage<BrowserSharePayload> {
    readonly target: string;
    readonly payload: BrowserSharePayload;
    static readonly type = "browser-share";
    constructor(target: string, payload: BrowserSharePayload);
}
