"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorInsertHtmlMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class TextEditorInsertHtmlMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
        this.payload = payload;
    }
}
exports.TextEditorInsertHtmlMessage = TextEditorInsertHtmlMessage;
TextEditorInsertHtmlMessage.type = "text-editor-insert-html";
