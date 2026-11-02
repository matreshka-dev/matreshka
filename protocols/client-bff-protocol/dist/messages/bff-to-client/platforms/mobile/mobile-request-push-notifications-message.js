"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileRequestPushNotificationsMessage = void 0;
const pingable_bff_to_client_message_1 = require("../../pingable-bff-to-client-message");
class MobileRequestPushNotificationsMessage extends pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage {
    constructor(target) {
        super(target);
        this.target = target;
    }
}
exports.MobileRequestPushNotificationsMessage = MobileRequestPushNotificationsMessage;
MobileRequestPushNotificationsMessage.type = "mobile-request-push-notifications";
