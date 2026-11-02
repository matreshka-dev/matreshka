"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBrowserPlatformMessages = registerBrowserPlatformMessages;
const client_to_bff_message_registry_1 = require("../../client-to-bff-message-registry");
const browser_get_geolocation_success_message_1 = require("./browser-get-geolocation-success-message");
const browser_request_push_notifications_action_granted_message_1 = require("./browser-request-push-notifications-action-granted-message");
function registerBrowserPlatformMessages() {
    client_to_bff_message_registry_1.clientToBffMessageRegistry.register(browser_get_geolocation_success_message_1.BrowserGetGeolocationSuccessMessage);
    client_to_bff_message_registry_1.clientToBffMessageRegistry.register(browser_request_push_notifications_action_granted_message_1.BrowserRequestPushNotificationsActionGrantedMessage);
}
