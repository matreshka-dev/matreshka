"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorMessage = void 0;
const component_interaction_message_1 = require("./components/component-interaction-message");
class ErrorMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target, payload) {
        super(target, payload);
        this.target = target;
        this.payload = payload;
        this.eventType = "error";
    }
}
exports.ErrorMessage = ErrorMessage;
ErrorMessage.type = "error-message";
