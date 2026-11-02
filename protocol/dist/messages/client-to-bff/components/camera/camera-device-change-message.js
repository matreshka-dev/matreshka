"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraDeviceChangeMessage = void 0;
const component_interaction_message_1 = require("../component-interaction-message");
class CameraDeviceChangeMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target, payload) {
        super(target, payload);
        this.target = target;
        this.payload = payload;
        this.eventType = "device-change";
    }
}
exports.CameraDeviceChangeMessage = CameraDeviceChangeMessage;
CameraDeviceChangeMessage.type = "camera-device-change";
