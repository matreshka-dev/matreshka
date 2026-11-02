"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BffToClientMessageReceivedMessage = void 0;
const bff_to_client_message_1 = require("./bff-to-client-message");
class BffToClientMessageReceivedMessage extends bff_to_client_message_1.BffToClientMessage {
    constructor(payload) {
        super(payload);
        this.payload = payload;
    }
}
exports.BffToClientMessageReceivedMessage = BffToClientMessageReceivedMessage;
BffToClientMessageReceivedMessage.type = "message-received";
