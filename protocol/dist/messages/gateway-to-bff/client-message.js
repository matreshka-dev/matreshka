"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientMessage = void 0;
const gateway_to_bff_message_1 = require("./gateway-to-bff-message");
class ClientMessage extends gateway_to_bff_message_1.GatewayToBffMessage {
    constructor(payload) {
        super(payload);
        this.payload = payload;
    }
}
exports.ClientMessage = ClientMessage;
ClientMessage.type = "client-message";
