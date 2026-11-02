"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TargetedMessage = void 0;
const message_1 = require("./message");
class TargetedMessage extends message_1.Message {
    constructor(target, payload) {
        super(payload);
        this.target = target;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            target: this.target,
        };
    }
}
exports.TargetedMessage = TargetedMessage;
