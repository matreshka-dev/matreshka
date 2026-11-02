"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentLeaveMessage = void 0;
const component_interaction_message_1 = require("./component-interaction-message");
class ComponentLeaveMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target) {
        super(target);
        this.eventType = "leave";
    }
}
exports.ComponentLeaveMessage = ComponentLeaveMessage;
ComponentLeaveMessage.type = "component-leave";
