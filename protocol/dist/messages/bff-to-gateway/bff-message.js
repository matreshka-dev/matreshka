"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BffMessage = void 0;
const bff_to_gateway_message_1 = require("./bff-to-gateway-message");
class BffMessage extends bff_to_gateway_message_1.BffToGatewayMessage {
    constructor(payload) {
        super(payload);
        this.payload = payload;
    }
}
exports.BffMessage = BffMessage;
BffMessage.type = "bff-message";
