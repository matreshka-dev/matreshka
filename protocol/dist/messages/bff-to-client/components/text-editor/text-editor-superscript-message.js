"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorSuperscriptMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class TextEditorSuperscriptMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.TextEditorSuperscriptMessage = TextEditorSuperscriptMessage;
TextEditorSuperscriptMessage.type = "text-editor-superscript";
