"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextInitMessage = void 0;
const reliable_client_to_bff_message_1 = require("../reliable-client-to-bff-message");
class ContextInitMessage extends reliable_client_to_bff_message_1.ReliableTargetedClientToBffMessage {
    constructor(target, payload = {}) {
        super(target, payload);
        this.payload = payload;
    }
}
exports.ContextInitMessage = ContextInitMessage;
ContextInitMessage.type = "context-init";
