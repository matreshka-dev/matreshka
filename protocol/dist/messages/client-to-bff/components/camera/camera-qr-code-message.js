"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CameraQrCodeMessage = void 0;
const component_interaction_message_1 = require("../component-interaction-message");
class CameraQrCodeMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target, payload) {
        super(target, payload);
        this.eventType = "qr-code";
    }
}
exports.CameraQrCodeMessage = CameraQrCodeMessage;
CameraQrCodeMessage.type = "camera-qr-code";
