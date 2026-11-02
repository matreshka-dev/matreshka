"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorUndoMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class TextEditorUndoMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.TextEditorUndoMessage = TextEditorUndoMessage;
TextEditorUndoMessage.type = "text-editor-undo";
