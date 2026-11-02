"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentClickMessage = void 0;
const component_interaction_message_1 = require("./component-interaction-message");
class ComponentClickMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target) {
        super(target, {});
        this.eventType = "click";
    }
}
exports.ComponentClickMessage = ComponentClickMessage;
ComponentClickMessage.type = "component-click";
