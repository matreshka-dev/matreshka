"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBrowserPlatformMessages = registerBrowserPlatformMessages;
const bff_to_client_message_registry_1 = require("../../bff-to-client-message-registry");
const browser_add_event_to_calendar_message_1 = require("./browser-add-event-to-calendar-message");
const browser_download_csv_content_message_1 = require("./browser-download-csv-content-message");
const browser_download_file_message_1 = require("./browser-download-file-message");
const browser_get_geolocation_message_1 = require("./browser-get-geolocation-message");
const browser_open_file_message_1 = require("./browser-open-file-message");
const browser_request_push_notifications_message_1 = require("./browser-request-push-notifications-message");
const browser_share_message_1 = require("./browser-share-message");
function registerBrowserPlatformMessages() {
    bff_to_client_message_registry_1.bffToClientMessageRegistry.register(browser_get_geolocation_message_1.BrowserGetGeolocationMessage);
    bff_to_client_message_registry_1.bffToClientMessageRegistry.register(browser_add_event_to_calendar_message_1.BrowserAddEventToCalendarMessage);
    bff_to_client_message_registry_1.bffToClientMessageRegistry.register(browser_download_csv_content_message_1.BrowserDownloadCsvContentMessage);
    bff_to_client_message_registry_1.bffToClientMessageRegistry.register(browser_download_file_message_1.BrowserDownloadFileMessage);
    bff_to_client_message_registry_1.bffToClientMessageRegistry.register(browser_open_file_message_1.BrowserOpenFileMessage);
    bff_to_client_message_registry_1.bffToClientMessageRegistry.register(browser_share_message_1.BrowserShareMessage);
    bff_to_client_message_registry_1.bffToClientMessageRegistry.register(browser_request_push_notifications_message_1.BrowserRequestPushNotificationsMessage);
}
