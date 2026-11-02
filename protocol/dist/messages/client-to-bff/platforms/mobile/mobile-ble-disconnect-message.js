"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileBleDisconnectMessage = void 0;
const pingable_client_to_bff_message_1 = require("../../pingable-client-to-bff-message");
class MobileBleDisconnectMessage extends pingable_client_to_bff_message_1.PingableTargetedClientToBffMessage {
    constructor(target) {
        super(target, {});
        this.target = target;
    }
}
exports.MobileBleDisconnectMessage = MobileBleDisconnectMessage;
MobileBleDisconnectMessage.type = "disconnect";
