"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseClientToBffMessage = parseClientToBffMessage;
const targeted_message_1 = require("../targeted-message");
const client_to_bff_message_registry_1 = require("./client-to-bff-message-registry");
const component_interaction_message_1 = require("./components/component-interaction-message");
const reliable_client_to_bff_message_1 = require("./reliable-client-to-bff-message");
function parseClientToBffMessage(data) {
    const messageClass = client_to_bff_message_registry_1.clientToBffMessageRegistry.findByType(data.type);
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
    if ((0, reliable_client_to_bff_message_1.isReliableClientToBffMessage)(message)) {
        message.restoreDelivery(data);
    }
    if (message instanceof component_interaction_message_1.ComponentInteractionMessage) {
        message.setHandlers((0, component_interaction_message_1.parseHandlers)(data.handlers));
    }
    return message;
}
