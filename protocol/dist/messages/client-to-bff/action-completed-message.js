"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActionCompletedMessage = void 0;
const pingable_client_to_bff_message_1 = require("./pingable-client-to-bff-message");
class ActionCompletedMessage extends pingable_client_to_bff_message_1.PingableTargetedClientToBffMessage {
    constructor(target) {
        super(target);
        this.target = target;
    }
}
exports.ActionCompletedMessage = ActionCompletedMessage;
ActionCompletedMessage.type = "action-completed";
