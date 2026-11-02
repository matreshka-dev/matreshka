import { registerBrowserPlatformMessages } from "./platforms/browser/register-messages";
import { registerCommonClientToBffMessages } from "./register-common-messages";

export function registerClientToBffMessages() {
  registerCommonClientToBffMessages();
  registerBrowserPlatformMessages();
}
