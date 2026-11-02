"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadAreaErrorMessage = void 0;
const component_interaction_message_1 = require("../component-interaction-message");
class FileUploadAreaErrorMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target, payload) {
        super(target, payload);
        this.payload = payload;
        this.eventType = "error";
    }
}
exports.FileUploadAreaErrorMessage = FileUploadAreaErrorMessage;
FileUploadAreaErrorMessage.type = "file-upload-area-error";
