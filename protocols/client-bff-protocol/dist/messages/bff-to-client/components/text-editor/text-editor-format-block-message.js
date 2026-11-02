"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorFormatBlockMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class TextEditorFormatBlockMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
        this.payload = payload;
    }
}
exports.TextEditorFormatBlockMessage = TextEditorFormatBlockMessage;
TextEditorFormatBlockMessage.type = "text-editor-format-block";
