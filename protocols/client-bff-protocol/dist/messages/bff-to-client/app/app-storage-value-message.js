"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppStorageValueMessage = void 0;
const pingable_bff_to_client_message_1 = require("../pingable-bff-to-client-message");
class AppStorageValueMessage extends pingable_bff_to_client_message_1.PingableBffToClientMessage {
    constructor(payload) {
        super(payload);
        this.payload = payload;
    }
}
exports.AppStorageValueMessage = AppStorageValueMessage;
AppStorageValueMessage.type = "storage-value";
