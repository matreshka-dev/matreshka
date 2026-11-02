"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapZoomChangeMessage = void 0;
const component_interaction_message_1 = require("../component-interaction-message");
class MapZoomChangeMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target, payload) {
        super(target, payload);
        this.target = target;
        this.payload = payload;
        this.eventType = "zoom-change";
    }
}
exports.MapZoomChangeMessage = MapZoomChangeMessage;
MapZoomChangeMessage.type = "map-zoom-change";
