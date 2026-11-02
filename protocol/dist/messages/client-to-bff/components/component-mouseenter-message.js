"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentMouseEnterMessage = void 0;
const component_interaction_message_1 = require("./component-interaction-message");
class ComponentMouseEnterMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target) {
        super(target);
        this.eventType = "mouseenter";
    }
}
exports.ComponentMouseEnterMessage = ComponentMouseEnterMessage;
ComponentMouseEnterMessage.type = "component-mouseenter";
