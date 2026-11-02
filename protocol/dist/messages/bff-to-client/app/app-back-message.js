"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppBackMessage = void 0;
const pingable_bff_to_client_message_1 = require("../pingable-bff-to-client-message");
class AppBackMessage extends pingable_bff_to_client_message_1.PingableBffToClientMessage {
    constructor() {
        super(undefined);
    }
}
exports.AppBackMessage = AppBackMessage;
AppBackMessage.type = "back";
