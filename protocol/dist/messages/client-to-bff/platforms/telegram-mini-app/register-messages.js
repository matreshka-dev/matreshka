"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTelegramPlatformMessages = registerTelegramPlatformMessages;
const client_to_bff_message_registry_1 = require("../../client-to-bff-message-registry");
const telegram_mini_app_get_geolocation_success_message_1 = require("./telegram-mini-app-get-geolocation-success-message");
const telegram_mini_app_request_contact_action_cancel_message_1 = require("./telegram-mini-app-request-contact-action-cancel-message");
const telegram_mini_app_request_contact_action_success_message_1 = require("./telegram-mini-app-request-contact-action-success-message");
function registerTelegramPlatformMessages() {
    client_to_bff_message_registry_1.clientToBffMessageRegistry.register(telegram_mini_app_request_contact_action_success_message_1.TelegramMiniAppRequestContactActionSuccessMessage);
    client_to_bff_message_registry_1.clientToBffMessageRegistry.register(telegram_mini_app_request_contact_action_cancel_message_1.TelegramMiniAppRequestContactActionCancelMessage);
    client_to_bff_message_registry_1.clientToBffMessageRegistry.register(telegram_mini_app_get_geolocation_success_message_1.TelegramMiniAppGetGeolocationSuccessMessage);
}
