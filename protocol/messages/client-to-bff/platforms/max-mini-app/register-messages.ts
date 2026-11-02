import { clientToBffMessageRegistry } from "../../client-to-bff-message-registry";
import { MaxMiniAppRequestContactActionSuccessMessage } from "./max-mini-app-request-contact-action-success-message";

export function registerMaxPlatformMessages() {
  clientToBffMessageRegistry.register(
    MaxMiniAppRequestContactActionSuccessMessage,
  );
}
