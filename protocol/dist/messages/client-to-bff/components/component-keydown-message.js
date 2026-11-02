"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentKeyDownMessage = void 0;
const component_interaction_message_1 = require("./component-interaction-message");
class ComponentKeyDownMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target, payload) {
        super(target, payload);
        this.eventType = "keydown";
    }
}
exports.ComponentKeyDownMessage = ComponentKeyDownMessage;
ComponentKeyDownMessage.type = "component-keydown";
