import { clientToBffMessageRegistry } from "../../client-to-bff-message-registry";
import { MobileBleConnectMessage } from "./mobile-ble-connect-message";
import { MobileBleDisconnectMessage } from "./mobile-ble-disconnect-message";
import { MobileBleReceiveMessage } from "./mobile-ble-receive-message";
import { MobileBleServicesMessage } from "./mobile-ble-services-message";
import { MobileBleValueMessage } from "./mobile-ble-value-message";
import { MobileGetGeolocationSuccessMessage } from "./mobile-get-geolocation-success-message";
import { MobileRequestPushNotificationsActionGrantedMessage } from "./mobile-request-push-notifications-action-granted-message";

export function registerMobilePlatformMessages() {
  clientToBffMessageRegistry.register(
    MobileRequestPushNotificationsActionGrantedMessage,
  );
  clientToBffMessageRegistry.register(MobileGetGeolocationSuccessMessage);
  clientToBffMessageRegistry.register(MobileBleConnectMessage);
  clientToBffMessageRegistry.register(MobileBleDisconnectMessage);
  clientToBffMessageRegistry.register(MobileBleReceiveMessage);
  clientToBffMessageRegistry.register(MobileBleValueMessage);
  clientToBffMessageRegistry.register(MobileBleServicesMessage);
}
