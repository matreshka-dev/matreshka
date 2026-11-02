"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerMobilePlatformMessages = registerMobilePlatformMessages;
const client_to_bff_message_registry_1 = require("../../client-to-bff-message-registry");
const mobile_ble_connect_message_1 = require("./mobile-ble-connect-message");
const mobile_ble_disconnect_message_1 = require("./mobile-ble-disconnect-message");
const mobile_ble_receive_message_1 = require("./mobile-ble-receive-message");
const mobile_ble_services_message_1 = require("./mobile-ble-services-message");
const mobile_ble_value_message_1 = require("./mobile-ble-value-message");
const mobile_get_geolocation_success_message_1 = require("./mobile-get-geolocation-success-message");
const mobile_request_push_notifications_action_granted_message_1 = require("./mobile-request-push-notifications-action-granted-message");
function registerMobilePlatformMessages() {
    client_to_bff_message_registry_1.clientToBffMessageRegistry.register(mobile_request_push_notifications_action_granted_message_1.MobileRequestPushNotificationsActionGrantedMessage);
    client_to_bff_message_registry_1.clientToBffMessageRegistry.register(mobile_get_geolocation_success_message_1.MobileGetGeolocationSuccessMessage);
    client_to_bff_message_registry_1.clientToBffMessageRegistry.register(mobile_ble_connect_message_1.MobileBleConnectMessage);
    client_to_bff_message_registry_1.clientToBffMessageRegistry.register(mobile_ble_disconnect_message_1.MobileBleDisconnectMessage);
    client_to_bff_message_registry_1.clientToBffMessageRegistry.register(mobile_ble_receive_message_1.MobileBleReceiveMessage);
    client_to_bff_message_registry_1.clientToBffMessageRegistry.register(mobile_ble_value_message_1.MobileBleValueMessage);
    client_to_bff_message_registry_1.clientToBffMessageRegistry.register(mobile_ble_services_message_1.MobileBleServicesMessage);
}
