"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextValuesMessage = void 0;
const reliable_bff_to_client_message_1 = require("../reliable-bff-to-client-message");
class ContextValuesMessage extends reliable_bff_to_client_message_1.ReliableTargetedBffToClientMessage {
    constructor(target, payload) {
        super(target, payload);
        this.payload = payload;
    }
}
exports.ContextValuesMessage = ContextValuesMessage;
ContextValuesMessage.type = "context-values";
