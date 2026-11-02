"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardZoomInMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class BoardZoomInMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.BoardZoomInMessage = BoardZoomInMessage;
BoardZoomInMessage.type = "board-zoom-in";
