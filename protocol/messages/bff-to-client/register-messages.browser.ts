import { registerBrowserPlatformMessages } from "./platforms/browser/register-messages";
import { registerCommonBffToClientMessages } from "./register-common-messages";

export function registerBffToClientMessages() {
  registerCommonBffToClientMessages();
  registerBrowserPlatformMessages();
}
