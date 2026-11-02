"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserGetGeolocationSuccessMessage = void 0;
const pingable_client_to_bff_message_1 = require("../../pingable-client-to-bff-message");
class BrowserGetGeolocationSuccessMessage extends pingable_client_to_bff_message_1.PingableTargetedClientToBffMessage {
    constructor(target, payload) {
        super(target, payload);
        this.target = target;
        this.payload = payload;
    }
}
exports.BrowserGetGeolocationSuccessMessage = BrowserGetGeolocationSuccessMessage;
BrowserGetGeolocationSuccessMessage.type = "browser-platform-get-geolocation-success";
