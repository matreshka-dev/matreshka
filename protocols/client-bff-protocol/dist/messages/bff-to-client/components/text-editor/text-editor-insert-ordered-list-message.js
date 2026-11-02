"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorInsertOrderedListMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class TextEditorInsertOrderedListMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.TextEditorInsertOrderedListMessage = TextEditorInsertOrderedListMessage;
TextEditorInsertOrderedListMessage.type = "text-editor-insert-ordered-list";
