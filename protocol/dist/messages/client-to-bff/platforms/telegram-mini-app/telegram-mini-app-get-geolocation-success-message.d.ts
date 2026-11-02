import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";
export type TelegramMiniAppGetGeolocationSuccessPayload = {
    latitude: number;
    longitude: number;
    altitude: number | null;
    course: number | null;
    speed: number | null;
    horizontal_accuracy: number | null;
    vertical_accuracy: number | null;
    course_accuracy: number | null;
    speed_accuracy: number | null;
};
export declare class TelegramMiniAppGetGeolocationSuccessMessage extends PingableTargetedClientToBffMessage<TelegramMiniAppGetGeolocationSuccessPayload> {
    readonly target: string;
    readonly payload: TelegramMiniAppGetGeolocationSuccessPayload;
    static readonly type = "telegram-mini-app-platform-get-geolocation-success";
    constructor(target: string, payload: TelegramMiniAppGetGeolocationSuccessPayload);
}
