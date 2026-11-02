"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileUploadAreaProgressMessage = void 0;
const component_interaction_message_1 = require("../component-interaction-message");
class FileUploadAreaProgressMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target, payload) {
        super(target, payload);
        this.payload = payload;
        this.eventType = "progress";
    }
}
exports.FileUploadAreaProgressMessage = FileUploadAreaProgressMessage;
FileUploadAreaProgressMessage.type = "file-upload-area-progress";
