"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorJustifyCenterMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class TextEditorJustifyCenterMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.TextEditorJustifyCenterMessage = TextEditorJustifyCenterMessage;
TextEditorJustifyCenterMessage.type = "text-editor-justify-center";
