import { registerTelegramPlatformMessages } from "./platforms/telegram-mini-app/register-messages";
import { registerCommonBffToClientMessages } from "./register-common-messages";

export function registerBffToClientMessages() {
  registerCommonBffToClientMessages();
  registerTelegramPlatformMessages();
}
