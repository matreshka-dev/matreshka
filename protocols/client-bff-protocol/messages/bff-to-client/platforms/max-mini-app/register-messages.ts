import { bffToClientMessageRegistry } from "../../bff-to-client-message-registry";
import { MaxMiniAppRequestContactMessage } from "./max-mini-app-request-contact-message";

export function registerMaxPlatformMessages() {
  bffToClientMessageRegistry.register(MaxMiniAppRequestContactMessage);
}
