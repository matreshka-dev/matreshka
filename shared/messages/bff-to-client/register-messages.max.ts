import { registerMaxPlatformMessages } from "./platforms/max-mini-app/register-messages";
import { registerCommonBffToClientMessages } from "./register-common-messages";

export function registerBffToClientMessages() {
  registerCommonBffToClientMessages();
  registerMaxPlatformMessages();
}
