"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorToggleItalicMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class TextEditorToggleItalicMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.TextEditorToggleItalicMessage = TextEditorToggleItalicMessage;
TextEditorToggleItalicMessage.type = "text-editor-toggle-italic";
