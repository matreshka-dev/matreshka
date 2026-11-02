import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export declare class MobileGetGeolocationMessage extends PingableTargetedBffToClientMessage<undefined> {
    readonly target: string;
    static readonly type = "mobile-get-geolocation";
    constructor(target: string);
}
