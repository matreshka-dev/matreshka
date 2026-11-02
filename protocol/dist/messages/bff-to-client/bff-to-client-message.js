"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetedBffToClientMessage = exports.BffToClientMessage = void 0;
const message_1 = require("../message");
const targeted_message_1 = require("../targeted-message");
class BffToClientMessage extends message_1.Message {
    constructor(payload) {
        super(payload);
    }
}
exports.BffToClientMessage = BffToClientMessage;
class TargetedBffToClientMessage extends targeted_message_1.TargetedMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.TargetedBffToClientMessage = TargetedBffToClientMessage;
