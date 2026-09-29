import { registerTelegramPlatformMessages } from "./platforms/telegram-mini-app/register-messages";
import { registerCommonClientToBffMessages } from "./register-common-messages";

export function registerClientToBffMessages() {
  registerCommonClientToBffMessages();
  registerTelegramPlatformMessages();
}
