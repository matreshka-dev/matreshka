import { clientToBffMessageRegistry } from "../../client-to-bff-message-registry";
import { BrowserGetGeolocationSuccessMessage } from "./browser-get-geolocation-success-message";
import { BrowserRequestPushNotificationsActionGrantedMessage } from "./browser-request-push-notifications-action-granted-message";

export function registerBrowserPlatformMessages() {
  clientToBffMessageRegistry.register(BrowserGetGeolocationSuccessMessage);
  clientToBffMessageRegistry.register(
    BrowserRequestPushNotificationsActionGrantedMessage,
  );
}
