"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramMiniAppGetGeolocationMessage = void 0;
const pingable_bff_to_client_message_1 = require("../../pingable-bff-to-client-message");
class TelegramMiniAppGetGeolocationMessage extends pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage {
    constructor(target) {
        super(target);
        this.target = target;
    }
}
exports.TelegramMiniAppGetGeolocationMessage = TelegramMiniAppGetGeolocationMessage;
TelegramMiniAppGetGeolocationMessage.type = "telegram-mini-app-get-geolocation";
