"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FormSubmitMessage = void 0;
const component_interaction_message_1 = require("../component-interaction-message");
class FormSubmitMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target) {
        super(target);
        this.eventType = "submit";
    }
}
exports.FormSubmitMessage = FormSubmitMessage;
FormSubmitMessage.type = "form-submit";
