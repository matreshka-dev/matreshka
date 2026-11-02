"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBffToGatewayMessage = parseBffToGatewayMessage;
const bff_to_gateway_message_registry_1 = require("./bff-to-gateway-message-registry");
function parseBffToGatewayMessage(data) {
    const messageClass = bff_to_gateway_message_registry_1.bffToGatewayMessageRegistry.findByType(data.type);
    if (!messageClass) {
        throw new Error(`Message type ${data.type} not registered`);
    }
    return new messageClass(data.payload);
}
