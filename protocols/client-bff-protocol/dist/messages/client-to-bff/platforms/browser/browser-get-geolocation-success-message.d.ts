import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";
export type BrowserGetGeolocationSuccessPayload = {
    latitude: number;
    longitude: number;
};
export declare class BrowserGetGeolocationSuccessMessage extends PingableTargetedClientToBffMessage<BrowserGetGeolocationSuccessPayload> {
    readonly target: string;
    readonly payload: BrowserGetGeolocationSuccessPayload;
    static readonly type = "browser-platform-get-geolocation-success";
    constructor(target: string, payload: BrowserGetGeolocationSuccessPayload);
}
