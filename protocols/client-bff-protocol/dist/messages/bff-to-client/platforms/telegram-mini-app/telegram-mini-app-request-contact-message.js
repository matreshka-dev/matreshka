"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramMiniAppRequestContactMessage = void 0;
const pingable_bff_to_client_message_1 = require("../../pingable-bff-to-client-message");
class TelegramMiniAppRequestContactMessage extends pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage {
    constructor(target) {
        super(target);
        this.target = target;
    }
}
exports.TelegramMiniAppRequestContactMessage = TelegramMiniAppRequestContactMessage;
TelegramMiniAppRequestContactMessage.type = "telegram-mini-app-request-contact";
