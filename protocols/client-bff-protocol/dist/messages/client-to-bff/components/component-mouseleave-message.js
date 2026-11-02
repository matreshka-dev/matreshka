"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentMouseLeaveMessage = void 0;
const component_interaction_message_1 = require("./component-interaction-message");
class ComponentMouseLeaveMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target) {
        super(target);
        this.eventType = "mouseleave";
    }
}
exports.ComponentMouseLeaveMessage = ComponentMouseLeaveMessage;
ComponentMouseLeaveMessage.type = "component-mouseleave";
