"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTelegramPlatformMessages = registerTelegramPlatformMessages;
const bff_to_client_message_registry_1 = require("../../bff-to-client-message-registry");
const telegram_mini_app_download_file_message_1 = require("./telegram-mini-app-download-file-message");
const telegram_mini_app_get_geolocation_message_1 = require("./telegram-mini-app-get-geolocation-message");
const telegram_mini_app_request_contact_message_1 = require("./telegram-mini-app-request-contact-message");
const telegram_mini_app_share_message_1 = require("./telegram-mini-app-share-message");
function registerTelegramPlatformMessages() {
    bff_to_client_message_registry_1.bffToClientMessageRegistry.register(telegram_mini_app_download_file_message_1.TelegramMiniAppDownloadFileMessage);
    bff_to_client_message_registry_1.bffToClientMessageRegistry.register(telegram_mini_app_share_message_1.TelegramMiniAppShareMessage);
    bff_to_client_message_registry_1.bffToClientMessageRegistry.register(telegram_mini_app_get_geolocation_message_1.TelegramMiniAppGetGeolocationMessage);
    bff_to_client_message_registry_1.bffToClientMessageRegistry.register(telegram_mini_app_request_contact_message_1.TelegramMiniAppRequestContactMessage);
}
