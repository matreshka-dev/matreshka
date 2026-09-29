import { HandshakeMessage as BffHandshakeMessage } from "@matreshka/shared/messages/bff-to-client/app/handshake-message";
import { bffToClientMessageRegistry } from "@matreshka/shared/messages/bff-to-client/bff-to-client-message-registry";
import { registerCommonBffToClientMessages } from "@matreshka/shared/messages/bff-to-client/register-common-messages";
import { HandshakeMessage as ClientHandshakeMessage } from "@matreshka/shared/messages/client-to-bff/app/handshake-message";
import { clientToBffMessageRegistry } from "@matreshka/shared/messages/client-to-bff/client-to-bff-message-registry";
import { registerCommonClientToBffMessages } from "@matreshka/shared/messages/client-to-bff/register-common-messages";

let registered = false;

/**
 * Регистрирует handshake-сообщения из `@matreshka/shared` для парсинга в gateway.
 *
 * Вызывается лениво при первом parse; idempotent.
 * Host-приложение (comin backend) может уже вызвать `registerClientToBffMessages()`.
 */
export function ensureGatewayMessagesRegistered(): void {
  if (registered) {
    return;
  }

  if (!clientToBffMessageRegistry.findByType(ClientHandshakeMessage.type)) {
    registerCommonClientToBffMessages();
  }

  if (!bffToClientMessageRegistry.findByType(BffHandshakeMessage.type)) {
    registerCommonBffToClientMessages();
  }

  registered = true;
}
