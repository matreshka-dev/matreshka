"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DialogCloseMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class DialogCloseMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.DialogCloseMessage = DialogCloseMessage;
DialogCloseMessage.type = "dialog-close";
