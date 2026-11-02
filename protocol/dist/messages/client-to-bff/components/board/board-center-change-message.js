"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoardCenterChangeMessage = void 0;
const component_interaction_message_1 = require("../component-interaction-message");
class BoardCenterChangeMessage extends component_interaction_message_1.ComponentInteractionMessage {
    constructor(target, payload) {
        super(target, payload);
        this.target = target;
        this.payload = payload;
        this.eventType = "center-change";
    }
}
exports.BoardCenterChangeMessage = BoardCenterChangeMessage;
BoardCenterChangeMessage.type = "board-center-change";
