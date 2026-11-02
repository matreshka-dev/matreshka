"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileGetGeolocationMessage = void 0;
const pingable_bff_to_client_message_1 = require("../../pingable-bff-to-client-message");
class MobileGetGeolocationMessage extends pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage {
    constructor(target) {
        super(target);
        this.target = target;
    }
}
exports.MobileGetGeolocationMessage = MobileGetGeolocationMessage;
MobileGetGeolocationMessage.type = "mobile-get-geolocation";
