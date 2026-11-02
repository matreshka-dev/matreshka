"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerClientToBffMessages = registerClientToBffMessages;
const register_messages_1 = require("./platforms/telegram-mini-app/register-messages");
const register_common_messages_1 = require("./register-common-messages");
function registerClientToBffMessages() {
    (0, register_common_messages_1.registerCommonClientToBffMessages)();
    (0, register_messages_1.registerTelegramPlatformMessages)();
}
