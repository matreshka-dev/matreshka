"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HandshakeMessage = void 0;
const package_json_1 = __importDefault(require("../../../package.json"));
const reliable_bff_to_client_message_1 = require("../reliable-bff-to-client-message");
class HandshakeMessage extends reliable_bff_to_client_message_1.ReliableBffToClientMessage {
    constructor(input) {
        super({ ...input, protocolVersion: package_json_1.default.version });
    }
}
exports.HandshakeMessage = HandshakeMessage;
HandshakeMessage.type = "handshake";
