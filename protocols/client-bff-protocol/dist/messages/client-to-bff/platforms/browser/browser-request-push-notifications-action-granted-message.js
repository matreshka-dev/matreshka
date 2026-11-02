"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserRequestPushNotificationsActionGrantedMessage = void 0;
const pingable_client_to_bff_message_1 = require("../../pingable-client-to-bff-message");
class BrowserRequestPushNotificationsActionGrantedMessage extends pingable_client_to_bff_message_1.PingableTargetedClientToBffMessage {
    constructor(target, payload) {
        super(target, payload);
        this.target = target;
        this.payload = payload;
    }
}
exports.BrowserRequestPushNotificationsActionGrantedMessage = BrowserRequestPushNotificationsActionGrantedMessage;
BrowserRequestPushNotificationsActionGrantedMessage.type = "browser-platform-request-push-notifications-action-granted";
