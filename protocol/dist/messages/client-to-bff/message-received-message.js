"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientToBffMessageReceivedMessage = void 0;
const client_to_bff_message_1 = require("./client-to-bff-message");
class ClientToBffMessageReceivedMessage extends client_to_bff_message_1.ClientToBffMessage {
    constructor(payload) {
        super(payload);
        this.payload = payload;
    }
}
exports.ClientToBffMessageReceivedMessage = ClientToBffMessageReceivedMessage;
ClientToBffMessageReceivedMessage.type = "message-received";
