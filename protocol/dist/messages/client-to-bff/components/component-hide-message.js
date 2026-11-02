"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentHideMessage = void 0;
const component_interaction_message_1 = require("./component-interaction-message");
class ComponentHideMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target) {
        super(target);
        this.eventType = "hide";
    }
}
exports.ComponentHideMessage = ComponentHideMessage;
ComponentHideMessage.type = "component-hide";
