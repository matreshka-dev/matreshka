"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextInitMessage = void 0;
const reliable_bff_to_client_message_1 = require("../reliable-bff-to-client-message");
class ContextInitMessage extends reliable_bff_to_client_message_1.ReliableTargetedBffToClientMessage {
    constructor(target, payload) {
        super(target, payload);
        this.payload = payload;
    }
}
exports.ContextInitMessage = ContextInitMessage;
ContextInitMessage.type = "context-init";
