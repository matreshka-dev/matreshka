"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMaxPlatformMessages = registerMaxPlatformMessages;
const bff_to_client_message_registry_1 = require("../../bff-to-client-message-registry");
const max_mini_app_request_contact_message_1 = require("./max-mini-app-request-contact-message");
function registerMaxPlatformMessages() {
    bff_to_client_message_registry_1.bffToClientMessageRegistry.register(max_mini_app_request_contact_message_1.MaxMiniAppRequestContactMessage);
}
