import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export declare class BrowserGetGeolocationMessage extends PingableTargetedBffToClientMessage<undefined> {
    readonly target: string;
    static readonly type = "browser-get-geolocation";
    constructor(target: string);
}
