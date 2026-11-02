import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";
export type MobileGetGeolocationSuccessPayload = {
    latitude: number;
    longitude: number;
};
export declare class MobileGetGeolocationSuccessMessage extends PingableTargetedClientToBffMessage<MobileGetGeolocationSuccessPayload> {
    readonly target: string;
    readonly payload: MobileGetGeolocationSuccessPayload;
    static readonly type = "mobile-platform-get-geolocation-success";
    constructor(target: string, payload: MobileGetGeolocationSuccessPayload);
}
