"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppReloadMessage = void 0;
const pingable_bff_to_client_message_1 = require("../pingable-bff-to-client-message");
class AppReloadMessage extends pingable_bff_to_client_message_1.PingableBffToClientMessage {
    constructor() {
        super(undefined);
    }
}
exports.AppReloadMessage = AppReloadMessage;
AppReloadMessage.type = "reload";
