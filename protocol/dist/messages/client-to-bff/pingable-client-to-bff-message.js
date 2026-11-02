"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingableTargetedClientToBffMessage = exports.PingableClientToBffMessage = void 0;
const reliable_client_to_bff_message_1 = require("./reliable-client-to-bff-message");
class PingableClientToBffMessage extends reliable_client_to_bff_message_1.ReliableClientToBffMessage {
}
exports.PingableClientToBffMessage = PingableClientToBffMessage;
class PingableTargetedClientToBffMessage extends reliable_client_to_bff_message_1.ReliableTargetedClientToBffMessage {
}
exports.PingableTargetedClientToBffMessage = PingableTargetedClientToBffMessage;
