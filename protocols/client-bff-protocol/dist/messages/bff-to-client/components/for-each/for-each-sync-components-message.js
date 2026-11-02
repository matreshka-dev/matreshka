"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForEachSyncComponentsMessage = void 0;
const reliable_component_command_message_1 = require("../../reliable-component-command-message");
class ForEachSyncComponentsMessage extends reliable_component_command_message_1.ReliableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
        this.payload = payload;
    }
}
exports.ForEachSyncComponentsMessage = ForEachSyncComponentsMessage;
ForEachSyncComponentsMessage.type = "for-each-sync-components";
