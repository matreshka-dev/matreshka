import { registerBrowserPlatformMessages } from "./platforms/browser/register-messages";
import { registerMaxPlatformMessages } from "./platforms/max-mini-app/register-messages";
import { registerMobilePlatformMessages } from "./platforms/mobile/register-messages";
import { registerTelegramPlatformMessages } from "./platforms/telegram-mini-app/register-messages";
import { registerCommonClientToBffMessages } from "./register-common-messages";

export function registerClientToBffMessages() {
  registerCommonClientToBffMessages();
  registerBrowserPlatformMessages();
  registerTelegramPlatformMessages();
  registerMaxPlatformMessages();
  registerMobilePlatformMessages();
}
