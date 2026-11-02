"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentEnterMessage = void 0;
const component_interaction_message_1 = require("./component-interaction-message");
class ComponentEnterMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target) {
        super(target);
        this.eventType = "enter";
    }
}
exports.ComponentEnterMessage = ComponentEnterMessage;
ComponentEnterMessage.type = "component-enter";
