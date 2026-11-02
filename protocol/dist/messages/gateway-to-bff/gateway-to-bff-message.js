"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GatewayToBffMessage = void 0;
const message_1 = require("../message");
class GatewayToBffMessage extends message_1.Message {
    constructor(payload) {
        super(payload);
    }
}
exports.GatewayToBffMessage = GatewayToBffMessage;
