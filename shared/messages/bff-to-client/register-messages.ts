import { registerBrowserPlatformMessages } from "./platforms/browser/register-messages";
import { registerMaxPlatformMessages } from "./platforms/max-mini-app/register-messages";
import { registerMobilePlatformMessages } from "./platforms/mobile/register-messages";
import { registerTelegramPlatformMessages } from "./platforms/telegram-mini-app/register-messages";
import { registerCommonBffToClientMessages } from "./register-common-messages";

export function registerBffToClientMessages() {
  registerCommonBffToClientMessages();
  registerBrowserPlatformMessages();
  registerTelegramPlatformMessages();
  registerMaxPlatformMessages();
  registerMobilePlatformMessages();
}
