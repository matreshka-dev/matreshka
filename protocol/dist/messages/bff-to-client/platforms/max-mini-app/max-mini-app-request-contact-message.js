"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MaxMiniAppRequestContactMessage = void 0;
const pingable_bff_to_client_message_1 = require("../../pingable-bff-to-client-message");
class MaxMiniAppRequestContactMessage extends pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage {
    constructor(target) {
        super(target);
        this.target = target;
    }
}
exports.MaxMiniAppRequestContactMessage = MaxMiniAppRequestContactMessage;
MaxMiniAppRequestContactMessage.type = "max-mini-app-request-contact";
