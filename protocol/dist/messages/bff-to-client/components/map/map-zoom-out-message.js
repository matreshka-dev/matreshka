"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MapZoomOutMessage = void 0;
const pingable_component_command_message_1 = require("../../pingable-component-command-message");
class MapZoomOutMessage extends pingable_component_command_message_1.PingableComponentCommandMessage {
    constructor(target, payload) {
        super(target, payload);
    }
}
exports.MapZoomOutMessage = MapZoomOutMessage;
MapZoomOutMessage.type = "map-zoom-out";
