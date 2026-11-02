"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerGatewayMessages = registerGatewayMessages;
const bff_message_1 = require("./bff-to-gateway/bff-message");
const bff_to_gateway_message_registry_1 = require("./bff-to-gateway/bff-to-gateway-message-registry");
const client_message_1 = require("./gateway-to-bff/client-message");
const connected_message_1 = require("./gateway-to-bff/connected-message");
const error_message_1 = require("./gateway-to-bff/error-message");
const gateway_to_bff_message_registry_1 = require("./gateway-to-bff/gateway-to-bff-message-registry");
const session_close_message_1 = require("./gateway-to-bff/session-close-message");
const session_open_message_1 = require("./gateway-to-bff/session-open-message");
let registered = false;
function registerGatewayMessages() {
    if (registered) {
        return;
    }
    gateway_to_bff_message_registry_1.gatewayToBffMessageRegistry.register(connected_message_1.ConnectedMessage);
    gateway_to_bff_message_registry_1.gatewayToBffMessageRegistry.register(session_open_message_1.SessionOpenMessage);
    gateway_to_bff_message_registry_1.gatewayToBffMessageRegistry.register(client_message_1.ClientMessage);
    gateway_to_bff_message_registry_1.gatewayToBffMessageRegistry.register(session_close_message_1.SessionCloseMessage);
    gateway_to_bff_message_registry_1.gatewayToBffMessageRegistry.register(error_message_1.ErrorMessage);
    bff_to_gateway_message_registry_1.bffToGatewayMessageRegistry.register(bff_message_1.BffMessage);
    registered = true;
}
