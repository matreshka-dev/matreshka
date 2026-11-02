"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NestedItemsSyncMessage = void 0;
const reliable_component_command_message_1 = require("../../reliable-component-command-message");
class NestedItemsSyncMessage extends reliable_component_command_message_1.ReliableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
        this.payload = payload;
    }
}
exports.NestedItemsSyncMessage = NestedItemsSyncMessage;
NestedItemsSyncMessage.type = "nested-items-sync";
