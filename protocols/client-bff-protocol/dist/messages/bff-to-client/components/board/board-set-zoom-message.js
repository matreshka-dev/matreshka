"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardSetZoomMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class BoardSetZoomMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
        this.target = target;
        this.payload = payload;
    }
}
exports.BoardSetZoomMessage = BoardSetZoomMessage;
BoardSetZoomMessage.type = "board-set-zoom";
