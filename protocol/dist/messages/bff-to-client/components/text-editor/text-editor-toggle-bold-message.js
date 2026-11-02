"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorToggleBoldMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class TextEditorToggleBoldMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.TextEditorToggleBoldMessage = TextEditorToggleBoldMessage;
TextEditorToggleBoldMessage.type = "text-editor-toggle-bold";
