import { HandshakeMessage as BffHandshakeMessage } from "@matreshka/shared/messages/bff-to-client/app/handshake-message";
import { parseBffToClientMessage } from "@matreshka/shared/messages/bff-to-client/parse-bff-to-client-message";
import type { MessageData } from "@matreshka/shared/messages/message";
import { ensureGatewayMessagesRegistered } from "./register-messages";

/**
 * Извлекает client token из BFF → client handshake через парсер `@matreshka/shared`.
 *
 * @param raw Сериализованное JSON-сообщение от BFF.
 * @returns Client token или `undefined`, если сообщение не BFF handshake.
 */
export function extractBffHandshakeToken(raw: string): string | undefined {
  try {
    ensureGatewayMessagesRegistered();
    const data = JSON.parse(raw) as MessageData;
    const message = parseBffToClientMessage(data);

    if (!(message instanceof BffHandshakeMessage)) {
      return undefined;
    }

    const { token } = message.payload;
    return token.length > 0 ? token : undefined;
  } catch {
    return undefined;
  }
}
