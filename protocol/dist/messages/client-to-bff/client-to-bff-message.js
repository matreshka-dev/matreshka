"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetedClientToBffMessage = exports.ClientToBffMessage = void 0;
const message_1 = require("../message");
const targeted_message_1 = require("../targeted-message");
class ClientToBffMessage extends message_1.Message {
    constructor(payload) {
        super(payload);
    }
}
exports.ClientToBffMessage = ClientToBffMessage;
class TargetedClientToBffMessage extends targeted_message_1.TargetedMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.TargetedClientToBffMessage = TargetedClientToBffMessage;
