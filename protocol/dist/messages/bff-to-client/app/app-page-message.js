"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppPageMessage = void 0;
const reliable_bff_to_client_message_1 = require("../reliable-bff-to-client-message");
class AppPageMessage extends reliable_bff_to_client_message_1.ReliableBffToClientMessage {
    constructor(payload) {
        super(payload);
        this.payload = payload;
    }
}
exports.AppPageMessage = AppPageMessage;
AppPageMessage.type = "page";
