import { bffToClientMessageRegistry } from "../../bff-to-client-message-registry";
import { BrowserAddEventToCalendarMessage } from "./browser-add-event-to-calendar-message";
import { BrowserDownloadCsvContentMessage } from "./browser-download-csv-content-message";
import { BrowserDownloadFileMessage } from "./browser-download-file-message";
import { BrowserGetGeolocationMessage } from "./browser-get-geolocation-message";
import { BrowserOpenFileMessage } from "./browser-open-file-message";
import { BrowserRequestPushNotificationsMessage } from "./browser-request-push-notifications-message";
import { BrowserShareMessage } from "./browser-share-message";

export function registerBrowserPlatformMessages() {
  bffToClientMessageRegistry.register(BrowserGetGeolocationMessage);
  bffToClientMessageRegistry.register(BrowserAddEventToCalendarMessage);
  bffToClientMessageRegistry.register(BrowserDownloadCsvContentMessage);
  bffToClientMessageRegistry.register(BrowserDownloadFileMessage);
  bffToClientMessageRegistry.register(BrowserOpenFileMessage);
  bffToClientMessageRegistry.register(BrowserShareMessage);
  bffToClientMessageRegistry.register(BrowserRequestPushNotificationsMessage);
}
