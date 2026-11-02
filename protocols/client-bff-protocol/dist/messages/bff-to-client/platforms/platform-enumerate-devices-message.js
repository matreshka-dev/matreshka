"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PlatformEnumerateDevicesMessage = void 0;
const pingable_bff_to_client_message_1 = require("../pingable-bff-to-client-message");
class PlatformEnumerateDevicesMessage extends pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage {
    constructor(target) {
        super(target);
        this.target = target;
    }
}
exports.PlatformEnumerateDevicesMessage = PlatformEnumerateDevicesMessage;
PlatformEnumerateDevicesMessage.type = "platform-enumerate-devices";
