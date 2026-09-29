import { registerMobilePlatformMessages } from "./platforms/mobile/register-messages";
import { registerCommonClientToBffMessages } from "./register-common-messages";

export function registerClientToBffMessages() {
  registerCommonClientToBffMessages();
  registerMobilePlatformMessages();
}
