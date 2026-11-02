"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessage = void 0;
const gateway_to_bff_message_1 = require("./gateway-to-bff-message");
class ErrorMessage extends gateway_to_bff_message_1.GatewayToBffMessage {
    constructor(payload) {
        super(payload);
        this.payload = payload;
    }
}
exports.ErrorMessage = ErrorMessage;
ErrorMessage.type = "error";
