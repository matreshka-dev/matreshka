"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentScrollMessage = void 0;
const component_interaction_message_1 = require("./component-interaction-message");
class ComponentScrollMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target, payload) {
        super(target, payload);
        this.eventType = "scroll";
    }
}
exports.ComponentScrollMessage = ComponentScrollMessage;
ComponentScrollMessage.type = "component-scroll";
