import { bffToClientMessageRegistry } from "../../bff-to-client-message-registry";
import { MobileAddEventToCalendarMessage } from "./mobile-add-event-to-calendar-message";
import { MobileConnectToBleDeviceMessage } from "./mobile-connect-to-ble-device-message";
import { MobileDisconnectMessage } from "./mobile-disconnect-message";
import { MobileDiscoverBleServicesMessage } from "./mobile-discover-ble-services-message";
import { MobileDownloadCsvContentMessage } from "./mobile-download-csv-content-message";
import { MobileDownloadFileMessage } from "./mobile-download-file-message";
import { MobileGetBleServicesMessage } from "./mobile-get-ble-services-message";
import { MobileGetGeolocationMessage } from "./mobile-get-geolocation-message";
import { MobileReadBleCharacteristicMessage } from "./mobile-read-ble-characteristic-message";
import { MobileRequestBleScanMessage } from "./mobile-request-ble-scan-message";
import { MobileRequestPushNotificationsMessage } from "./mobile-request-push-notifications-message";
import { MobileShareMessage } from "./mobile-share-message";
import { MobileStopMessage } from "./mobile-stop-message";

export function registerMobilePlatformMessages() {
  bffToClientMessageRegistry.register(MobileAddEventToCalendarMessage);
  bffToClientMessageRegistry.register(MobileDownloadCsvContentMessage);
  bffToClientMessageRegistry.register(MobileDownloadFileMessage);
  bffToClientMessageRegistry.register(MobileShareMessage);
  bffToClientMessageRegistry.register(MobileGetGeolocationMessage);
  bffToClientMessageRegistry.register(MobileRequestPushNotificationsMessage);
  bffToClientMessageRegistry.register(MobileRequestBleScanMessage);
  bffToClientMessageRegistry.register(MobileStopMessage);
  bffToClientMessageRegistry.register(MobileConnectToBleDeviceMessage);
  bffToClientMessageRegistry.register(MobileDisconnectMessage);
  bffToClientMessageRegistry.register(MobileReadBleCharacteristicMessage);
  bffToClientMessageRegistry.register(MobileGetBleServicesMessage);
  bffToClientMessageRegistry.register(MobileDiscoverBleServicesMessage);
}
