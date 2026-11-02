"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMaxPlatformMessages = registerMaxPlatformMessages;
const client_to_bff_message_registry_1 = require("../../client-to-bff-message-registry");
const max_mini_app_request_contact_action_success_message_1 = require("./max-mini-app-request-contact-action-success-message");
function registerMaxPlatformMessages() {
    client_to_bff_message_registry_1.clientToBffMessageRegistry.register(max_mini_app_request_contact_action_success_message_1.MaxMiniAppRequestContactActionSuccessMessage);
}
