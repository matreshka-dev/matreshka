"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReliableComponentCommandMessage = exports.PingableComponentCommandMessage = void 0;
exports.isComponentCommandMessage = isComponentCommandMessage;
const pingable_component_command_message_1 = require("./pingable-component-command-message");
Object.defineProperty(exports, "PingableComponentCommandMessage", { enumerable: true, get: function () { return pingable_component_command_message_1.PingableComponentCommandMessage; } });
const reliable_component_command_message_1 = require("./reliable-component-command-message");
Object.defineProperty(exports, "ReliableComponentCommandMessage", { enumerable: true, get: function () { return reliable_component_command_message_1.ReliableComponentCommandMessage; } });
function isComponentCommandMessage(message) {
    return (message instanceof pingable_component_command_message_1.PingableComponentCommandMessage ||
        message instanceof reliable_component_command_message_1.ReliableComponentCommandMessage);
}
