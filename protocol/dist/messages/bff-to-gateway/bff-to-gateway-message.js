"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BffToGatewayMessage = void 0;
const message_1 = require("../message");
class BffToGatewayMessage extends message_1.Message {
    constructor(payload) {
        super(payload);
    }
}
exports.BffToGatewayMessage = BffToGatewayMessage;
