"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandshakeMessage = void 0;
const reliable_bff_to_client_message_1 = require("../reliable-bff-to-client-message");
class HandshakeMessage extends reliable_bff_to_client_message_1.ReliableBffToClientMessage {
    constructor(payload) {
        super(payload);
        this.payload = payload;
    }
}
exports.HandshakeMessage = HandshakeMessage;
HandshakeMessage.type = "handshake";
