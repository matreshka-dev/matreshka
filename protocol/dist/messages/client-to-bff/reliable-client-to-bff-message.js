"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReliableTargetedClientToBffMessage = exports.ReliableClientToBffMessage = void 0;
exports.isReliableClientToBffMessage = isReliableClientToBffMessage;
const random_uuid_1 = require("../../utils/random-uuid");
const client_to_bff_message_1 = require("./client-to-bff-message");
class ReliableClientToBffMessage extends client_to_bff_message_1.ClientToBffMessage {
    get id() {
        this._id ?? (this._id = (0, random_uuid_1.randomUuid)());
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
exports.ReliableClientToBffMessage = ReliableClientToBffMessage;
class ReliableTargetedClientToBffMessage extends client_to_bff_message_1.TargetedClientToBffMessage {
    get id() {
        this._id ?? (this._id = (0, random_uuid_1.randomUuid)());
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
exports.ReliableTargetedClientToBffMessage = ReliableTargetedClientToBffMessage;
function isReliableClientToBffMessage(message) {
    return (message instanceof ReliableClientToBffMessage ||
        message instanceof ReliableTargetedClientToBffMessage);
}
