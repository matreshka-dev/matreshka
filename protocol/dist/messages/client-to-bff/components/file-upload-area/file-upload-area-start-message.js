"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadAreaStartMessage = void 0;
const component_interaction_message_1 = require("../component-interaction-message");
class FileUploadAreaStartMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target, payload) {
        super(target, payload);
        this.payload = payload;
        this.eventType = "start";
    }
}
exports.FileUploadAreaStartMessage = FileUploadAreaStartMessage;
FileUploadAreaStartMessage.type = "file-upload-area-start";
