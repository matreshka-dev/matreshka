"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorInsertUnorderedListMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class TextEditorInsertUnorderedListMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.TextEditorInsertUnorderedListMessage = TextEditorInsertUnorderedListMessage;
TextEditorInsertUnorderedListMessage.type = "text-editor-insert-unordered-list";
