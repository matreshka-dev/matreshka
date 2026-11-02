"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorJustifyFullMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class TextEditorJustifyFullMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.TextEditorJustifyFullMessage = TextEditorJustifyFullMessage;
TextEditorJustifyFullMessage.type = "text-editor-justify-full";
