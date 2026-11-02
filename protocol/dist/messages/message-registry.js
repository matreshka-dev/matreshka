"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRegistry = void 0;
class MessageRegistry {
    constructor() {
        this.registry = new Map();
    }
    register(messageClass) {
        if (this.registry.has(messageClass.type)) {
            throw new Error(`Message type ${messageClass.type} already registered`);
        }
        this.registry.set(messageClass.type, messageClass);
    }
    findByType(type) {
        return this.registry.get(type);
    }
}
exports.MessageRegistry = MessageRegistry;
