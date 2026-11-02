"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardZoomOutMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class BoardZoomOutMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.BoardZoomOutMessage = BoardZoomOutMessage;
BoardZoomOutMessage.type = "board-zoom-out";
