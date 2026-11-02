"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileBleConnectMessage = void 0;
const pingable_client_to_bff_message_1 = require("../../pingable-client-to-bff-message");
class MobileBleConnectMessage extends pingable_client_to_bff_message_1.PingableTargetedClientToBffMessage {
    constructor(target) {
        super(target);
        this.target = target;
    }
}
exports.MobileBleConnectMessage = MobileBleConnectMessage;
MobileBleConnectMessage.type = "connect";
