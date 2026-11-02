"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionOpenMessage = void 0;
const gateway_to_bff_message_1 = require("./gateway-to-bff-message");
class SessionOpenMessage extends gateway_to_bff_message_1.GatewayToBffMessage {
    constructor(payload) {
        super(payload);
        this.payload = payload;
    }
}
exports.SessionOpenMessage = SessionOpenMessage;
SessionOpenMessage.type = "session-open";
