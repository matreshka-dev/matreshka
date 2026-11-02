"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseGatewayToBffMessage = parseGatewayToBffMessage;
const gateway_to_bff_message_registry_1 = require("./gateway-to-bff-message-registry");
function parseGatewayToBffMessage(data) {
    const messageClass = gateway_to_bff_message_registry_1.gatewayToBffMessageRegistry.findByType(data.type);
    if (!messageClass) {
        throw new Error(`Message type ${data.type} not registered`);
    }
    return new messageClass(data.payload);
}
