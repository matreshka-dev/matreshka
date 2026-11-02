"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingableTargetedBffToClientMessage = exports.PingableBffToClientMessage = void 0;
const reliable_bff_to_client_message_1 = require("./reliable-bff-to-client-message");
class PingableBffToClientMessage extends reliable_bff_to_client_message_1.ReliableBffToClientMessage {
}
exports.PingableBffToClientMessage = PingableBffToClientMessage;
class PingableTargetedBffToClientMessage extends reliable_bff_to_client_message_1.ReliableTargetedBffToClientMessage {
}
exports.PingableTargetedBffToClientMessage = PingableTargetedBffToClientMessage;
