"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentShowMessage = void 0;
const component_interaction_message_1 = require("./component-interaction-message");
class ComponentShowMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target) {
        super(target);
        this.eventType = "show";
    }
}
exports.ComponentShowMessage = ComponentShowMessage;
ComponentShowMessage.type = "component-show";
