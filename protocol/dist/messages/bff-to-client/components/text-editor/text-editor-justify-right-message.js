"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorJustifyRightMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class TextEditorJustifyRightMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.TextEditorJustifyRightMessage = TextEditorJustifyRightMessage;
TextEditorJustifyRightMessage.type = "text-editor-justify-right";
