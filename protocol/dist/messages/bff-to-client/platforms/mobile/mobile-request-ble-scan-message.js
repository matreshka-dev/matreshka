"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileRequestBleScanMessage = void 0;
const pingable_bff_to_client_message_1 = require("../../pingable-bff-to-client-message");
class MobileRequestBleScanMessage extends pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage {
    constructor(target, payload) {
        super(target, payload);
        this.target = target;
        this.payload = payload;
    }
}
exports.MobileRequestBleScanMessage = MobileRequestBleScanMessage;
MobileRequestBleScanMessage.type = "request-ble-scan";
