"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingableComponentCommandMessage = void 0;
const pingable_bff_to_client_message_1 = require("./pingable-bff-to-client-message");
class PingableComponentCommandMessage extends pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage {
    constructor(target, payload) {
        super(target, payload);
    }
    get actionScope() {
        return this.payload.actionScope;
    }
}
exports.PingableComponentCommandMessage = PingableComponentCommandMessage;
