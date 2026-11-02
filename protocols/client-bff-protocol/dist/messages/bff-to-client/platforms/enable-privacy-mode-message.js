"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnablePrivacyModeMessage = void 0;
const pingable_bff_to_client_message_1 = require("../pingable-bff-to-client-message");
class EnablePrivacyModeMessage extends pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage {
    constructor(target) {
        super(target);
        this.target = target;
    }
}
exports.EnablePrivacyModeMessage = EnablePrivacyModeMessage;
EnablePrivacyModeMessage.type = "enable-privacy-mode";
