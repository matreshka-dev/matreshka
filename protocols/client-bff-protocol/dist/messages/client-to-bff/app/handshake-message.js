"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandshakeMessage = void 0;
const reliable_client_to_bff_message_1 = require("../reliable-client-to-bff-message");
class HandshakeMessage extends reliable_client_to_bff_message_1.ReliableClientToBffMessage {
    constructor(payload) {
        super(payload);
        this.payload = payload;
    }
}
exports.HandshakeMessage = HandshakeMessage;
HandshakeMessage.type = "handshake";
