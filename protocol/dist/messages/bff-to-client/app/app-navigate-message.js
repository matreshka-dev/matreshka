"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppNavigateMessage = void 0;
const pingable_bff_to_client_message_1 = require("../pingable-bff-to-client-message");
class AppNavigateMessage extends pingable_bff_to_client_message_1.PingableBffToClientMessage {
    constructor(payload) {
        super(payload);
        this.payload = payload;
    }
}
exports.AppNavigateMessage = AppNavigateMessage;
AppNavigateMessage.type = "navigate";
