import { clientToBffMessageRegistry } from "../../client-to-bff-message-registry";
import { TelegramMiniAppGetGeolocationSuccessMessage } from "./telegram-mini-app-get-geolocation-success-message";
import { TelegramMiniAppRequestContactActionCancelMessage } from "./telegram-mini-app-request-contact-action-cancel-message";
import { TelegramMiniAppRequestContactActionSuccessMessage } from "./telegram-mini-app-request-contact-action-success-message";

export function registerTelegramPlatformMessages() {
  clientToBffMessageRegistry.register(
    TelegramMiniAppRequestContactActionSuccessMessage,
  );
  clientToBffMessageRegistry.register(
    TelegramMiniAppRequestContactActionCancelMessage,
  );
  clientToBffMessageRegistry.register(
    TelegramMiniAppGetGeolocationSuccessMessage,
  );
}
