"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileBleValueMessage = void 0;
const pingable_client_to_bff_message_1 = require("../../pingable-client-to-bff-message");
class MobileBleValueMessage extends pingable_client_to_bff_message_1.PingableTargetedClientToBffMessage {
    constructor(target, payload) {
        super(target, payload);
        this.target = target;
        this.payload = payload;
    }
}
exports.MobileBleValueMessage = MobileBleValueMessage;
MobileBleValueMessage.type = "value";
