"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseBffToClientMessage = parseBffToClientMessage;
const targeted_message_1 = require("../targeted-message");
const bff_to_client_message_registry_1 = require("./bff-to-client-message-registry");
const reliable_bff_to_client_message_1 = require("./reliable-bff-to-client-message");
function parseBffToClientMessage(data) {
    const messageClass = bff_to_client_message_registry_1.bffToClientMessageRegistry.findByType(data.type);
    if (!messageClass) {
        throw new Error(`Message type ${data.type} not registered`);
    }
    const message = messageClass.prototype instanceof targeted_message_1.TargetedMessage
        ? (() => {
            if (typeof data.target !== "string") {
                throw new Error(`Message type ${data.type} requires target, got ${data.target}`);
            }
            return new messageClass(data.target, data.payload);
        })()
        : new messageClass(data.payload);
    if ((0, reliable_bff_to_client_message_1.isReliableBffToClientMessage)(message)) {
        message.restoreDelivery(data);
    }
    return message;
}
