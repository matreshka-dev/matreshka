"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PopoverShowMessage = void 0;
const pingable_bff_to_client_message_1 = require("../../pingable-bff-to-client-message");
class PopoverShowMessage extends pingable_bff_to_client_message_1.PingableTargetedBffToClientMessage {
    constructor(target, payload) {
        super(target, payload);
        this.target = target;
        this.payload = payload;
    }
}
exports.PopoverShowMessage = PopoverShowMessage;
PopoverShowMessage.type = "show-popover";
