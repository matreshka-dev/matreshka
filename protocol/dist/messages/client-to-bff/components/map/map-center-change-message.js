"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapCenterChangeMessage = void 0;
const component_interaction_message_1 = require("../component-interaction-message");
class MapCenterChangeMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target, payload) {
        super(target, payload);
        this.target = target;
        this.payload = payload;
        this.eventType = "center-change";
    }
}
exports.MapCenterChangeMessage = MapCenterChangeMessage;
MapCenterChangeMessage.type = "map-center-change";
