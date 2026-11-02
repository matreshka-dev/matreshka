"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBffToClientMessages = registerBffToClientMessages;
const register_messages_1 = require("./platforms/mobile/register-messages");
const register_common_messages_1 = require("./register-common-messages");
function registerBffToClientMessages() {
    (0, register_common_messages_1.registerCommonBffToClientMessages)();
    (0, register_messages_1.registerMobilePlatformMessages)();
}
