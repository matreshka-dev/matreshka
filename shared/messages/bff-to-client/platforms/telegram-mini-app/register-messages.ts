import { bffToClientMessageRegistry } from "../../bff-to-client-message-registry";
import { TelegramMiniAppDownloadFileMessage } from "./telegram-mini-app-download-file-message";
import { TelegramMiniAppGetGeolocationMessage } from "./telegram-mini-app-get-geolocation-message";
import { TelegramMiniAppRequestContactMessage } from "./telegram-mini-app-request-contact-message";
import { TelegramMiniAppShareMessage } from "./telegram-mini-app-share-message";

export function registerTelegramPlatformMessages() {
  bffToClientMessageRegistry.register(TelegramMiniAppDownloadFileMessage);
  bffToClientMessageRegistry.register(TelegramMiniAppShareMessage);
  bffToClientMessageRegistry.register(TelegramMiniAppGetGeolocationMessage);
  bffToClientMessageRegistry.register(TelegramMiniAppRequestContactMessage);
}
