"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadAreaCompleteMessage = void 0;
const component_interaction_message_1 = require("../component-interaction-message");
class FileUploadAreaCompleteMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target, payload) {
        super(target, payload);
        this.payload = payload;
        this.eventType = "complete";
    }
}
exports.FileUploadAreaCompleteMessage = FileUploadAreaCompleteMessage;
FileUploadAreaCompleteMessage.type = "file-upload-area-complete";
