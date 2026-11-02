"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerBffToClientMessages = registerBffToClientMessages;
const register_messages_1 = require("./platforms/browser/register-messages");
const register_messages_2 = require("./platforms/max-mini-app/register-messages");
const register_messages_3 = require("./platforms/mobile/register-messages");
const register_messages_4 = require("./platforms/telegram-mini-app/register-messages");
const register_common_messages_1 = require("./register-common-messages");
function registerBffToClientMessages() {
    (0, register_common_messages_1.registerCommonBffToClientMessages)();
    (0, register_messages_1.registerBrowserPlatformMessages)();
    (0, register_messages_4.registerTelegramPlatformMessages)();
    (0, register_messages_2.registerMaxPlatformMessages)();
    (0, register_messages_3.registerMobilePlatformMessages)();
}
