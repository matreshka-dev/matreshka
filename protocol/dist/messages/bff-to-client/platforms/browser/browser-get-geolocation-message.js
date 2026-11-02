"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserGetGeolocationMessage = void 0;
const pingable_bff_to_client_message_1 = require("../../pingable-bff-to-client-message");
class BrowserGetGeolocationMessage extends pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage {
    constructor(target) {
        super(target);
        this.target = target;
    }
}
exports.BrowserGetGeolocationMessage = BrowserGetGeolocationMessage;
BrowserGetGeolocationMessage.type = "browser-get-geolocation";
