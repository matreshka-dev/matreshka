"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextValuesMessage = void 0;
const reliable_client_to_bff_message_1 = require("../reliable-client-to-bff-message");
class ContextValuesMessage extends reliable_client_to_bff_message_1.ReliableTargetedClientToBffMessage {
    constructor(target, payload) {
        super(target, payload);
        this.payload = payload;
    }
}
exports.ContextValuesMessage = ContextValuesMessage;
ContextValuesMessage.type = "context-values";
