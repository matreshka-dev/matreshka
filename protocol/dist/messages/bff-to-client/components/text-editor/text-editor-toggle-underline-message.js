"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorToggleUnderlineMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class TextEditorToggleUnderlineMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.TextEditorToggleUnderlineMessage = TextEditorToggleUnderlineMessage;
TextEditorToggleUnderlineMessage.type = "text-editor-toggle-underline";
