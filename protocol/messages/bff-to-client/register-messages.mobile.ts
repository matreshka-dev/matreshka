import { registerMobilePlatformMessages } from "./platforms/mobile/register-messages";
import { registerCommonBffToClientMessages } from "./register-common-messages";

export function registerBffToClientMessages() {
  registerCommonBffToClientMessages();
  registerMobilePlatformMessages();
}
