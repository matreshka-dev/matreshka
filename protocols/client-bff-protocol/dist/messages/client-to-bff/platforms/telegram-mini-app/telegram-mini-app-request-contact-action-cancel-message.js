"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramMiniAppRequestContactActionCancelMessage = void 0;
const pingable_client_to_bff_message_1 = require("../../pingable-client-to-bff-message");
class TelegramMiniAppRequestContactActionCancelMessage extends pingable_client_to_bff_message_1.PingableTargetedClientToBffMessage {
    constructor(target) {
        super(target, {});
        this.target = target;
    }
}
exports.TelegramMiniAppRequestContactActionCancelMessage = TelegramMiniAppRequestContactActionCancelMessage;
TelegramMiniAppRequestContactActionCancelMessage.type = "telegram-mini-app-platform-request-contact-action-cancel";
