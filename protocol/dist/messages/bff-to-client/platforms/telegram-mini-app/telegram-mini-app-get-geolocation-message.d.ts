import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export declare class TelegramMiniAppGetGeolocationMessage extends PingableTargetedBffToClientMessage<undefined> {
    readonly target: string;
    static readonly type = "telegram-mini-app-get-geolocation";
    constructor(target: string);
}
