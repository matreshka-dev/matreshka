"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorJustifyLeftMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class TextEditorJustifyLeftMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.TextEditorJustifyLeftMessage = TextEditorJustifyLeftMessage;
TextEditorJustifyLeftMessage.type = "text-editor-justify-left";
