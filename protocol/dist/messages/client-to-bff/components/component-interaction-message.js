"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComponentInteractionMessage = void 0;
exports.parseHandlers = parseHandlers;
const pingable_client_to_bff_message_1 = require("../pingable-client-to-bff-message");
class ComponentInteractionMessage extends pingable_client_to_bff_message_1.PingableTargetedClientToBffMessage {
    constructor() {
        super(...arguments);
        this.handlers = [];
    }
    getHandlers() {
        return this.handlers;
    }
    setHandlers(handlers) {
        this.handlers = handlers;
        return this;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            handlers: this.handlers,
        };
    }
}
exports.ComponentInteractionMessage = ComponentInteractionMessage;
function parseHandlers(value) {
    if (value === undefined) {
        return [];
    }
    if (!Array.isArray(value) ||
        !value.every((item) => typeof item === "number" && Number.isInteger(item) && item >= 0)) {
        throw new Error("handlers must be an array of non-negative integers");
    }
    return value;
}
