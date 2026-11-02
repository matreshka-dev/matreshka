import { registerMaxPlatformMessages } from "./platforms/max-mini-app/register-messages";
import { registerCommonClientToBffMessages } from "./register-common-messages";

export function registerClientToBffMessages() {
  registerCommonClientToBffMessages();
  registerMaxPlatformMessages();
}
