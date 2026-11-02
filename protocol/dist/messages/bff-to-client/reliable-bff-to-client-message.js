"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReliableTargetedBffToClientMessage = exports.ReliableBffToClientMessage = void 0;
exports.isReliableBffToClientMessage = isReliableBffToClientMessage;
const bff_to_client_message_1 = require("./bff-to-client-message");
class ReliableBffToClientMessage extends bff_to_client_message_1.BffToClientMessage {
    get id() {
        this._id ?? (this._id = globalThis.crypto.randomUUID());
        return this._id;
    }
    get attempt() {
        this._attempt ?? (this._attempt = 1);
        return this._attempt;
    }
    nextAttempt() {
        this._attempt = this.attempt + 1;
        return this._attempt;
    }
    restoreDelivery(data) {
        this._id = data.id;
        this._attempt = data.attempt;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            id: this.id,
            attempt: this.attempt,
        };
    }
}
exports.ReliableBffToClientMessage = ReliableBffToClientMessage;
class ReliableTargetedBffToClientMessage extends bff_to_client_message_1.TargetedBffToClientMessage {
    get id() {
        this._id ?? (this._id = globalThis.crypto.randomUUID());
        return this._id;
    }
    get attempt() {
        this._attempt ?? (this._attempt = 1);
        return this._attempt;
    }
    nextAttempt() {
        this._attempt = this.attempt + 1;
        return this._attempt;
    }
    restoreDelivery(data) {
        this._id = data.id;
        this._attempt = data.attempt;
    }
    toJSON() {
        return {
            ...super.toJSON(),
            id: this.id,
            attempt: this.attempt,
        };
    }
}
exports.ReliableTargetedBffToClientMessage = ReliableTargetedBffToClientMessage;
function isReliableBffToClientMessage(message) {
    return (message instanceof ReliableBffToClientMessage ||
        message instanceof ReliableTargetedBffToClientMessage);
}
