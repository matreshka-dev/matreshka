"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Message = void 0;
class Message {
    get type() {
        return this.constructor.type;
    }
    constructor(payload) {
        this.payload = payload;
    }
    toJSON() {
        return {
            type: this.type,
            payload: this.payload,
        };
    }
}
exports.Message = Message;
