"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContextDestroyMessage = void 0;
const pingable_bff_to_client_message_1 = require("../pingable-bff-to-client-message");
class ContextDestroyMessage extends pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage {
    constructor(target) {
        super(target, undefined);
    }
}
exports.ContextDestroyMessage = ContextDestroyMessage;
ContextDestroyMessage.type = "context-destroy";
