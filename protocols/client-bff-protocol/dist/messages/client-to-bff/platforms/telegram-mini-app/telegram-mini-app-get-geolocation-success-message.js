"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramMiniAppGetGeolocationSuccessMessage = void 0;
const pingable_client_to_bff_message_1 = require("../../pingable-client-to-bff-message");
class TelegramMiniAppGetGeolocationSuccessMessage extends pingable_client_to_bff_message_1.PingableTargetedClientToBffMessage {
    constructor(target, payload) {
        super(target, payload);
        this.target = target;
        this.payload = payload;
    }
}
exports.TelegramMiniAppGetGeolocationSuccessMessage = TelegramMiniAppGetGeolocationSuccessMessage;
TelegramMiniAppGetGeolocationSuccessMessage.type = "telegram-mini-app-platform-get-geolocation-success";
