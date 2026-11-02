"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TextEditorSelectionChangeMessage = void 0;
const component_interaction_message_1 = require("../component-interaction-message");
class TextEditorSelectionChangeMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target, payload) {
        super(target, payload);
        this.target = target;
        this.payload = payload;
        this.eventType = "selection-change";
    }
}
exports.TextEditorSelectionChangeMessage = TextEditorSelectionChangeMessage;
TextEditorSelectionChangeMessage.type = "text-editor-selection-change";
