"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DisablePrivacyModeMessage = void 0;
const pingable_bff_to_client_message_1 = require("../pingable-bff-to-client-message");
class DisablePrivacyModeMessage extends pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage {
    constructor(target) {
        super(target);
        this.target = target;
    }
}
exports.DisablePrivacyModeMessage = DisablePrivacyModeMessage;
DisablePrivacyModeMessage.type = "disable-privacy-mode";
