"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppClientStateMessage = void 0;
const reliable_client_to_bff_message_1 = require("../reliable-client-to-bff-message");
class AppClientStateMessage extends reliable_client_to_bff_message_1.ReliableClientToBffMessage {
    constructor(payload) {
        super(payload);
        this.payload = payload;
    }
}
exports.AppClientStateMessage = AppClientStateMessage;
AppClientStateMessage.type = "client-state";
