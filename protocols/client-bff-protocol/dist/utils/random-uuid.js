"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomUuid = randomUuid;
function randomUuidFallback() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
        const random = Math.floor(Math.random() * 16);
        const value = char === "x" ? random : (random & 0x3) | 0x8;
        return value.toString(16);
    });
}
function randomUuid() {
    const crypto = globalThis
        .crypto;
    if (typeof crypto?.randomUUID === "function") {
        return crypto.randomUUID();
    }
    return randomUuidFallback();
}
