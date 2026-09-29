import { HandshakeMessage as ClientHandshakeMessage } from "@matreshka/shared/messages/client-to-bff/app/handshake-message";
import { parseClientToBffMessage } from "@matreshka/shared/messages/client-to-bff/parse-client-to-bff-message";
import type { MessageData } from "@matreshka/shared/messages/message";
import { ensureGatewayMessagesRegistered } from "./register-messages";

/** Результат парсинга client → BFF handshake для маршрутизации. */
export type ParsedClientHandshake = {
  applicationId: string;
};

/**
 * Извлекает `applicationId` из client handshake через парсер `@matreshka/shared`.
 *
 * @param raw Сериализованное JSON-сообщение от клиента.
 * @returns Распознанный handshake или `undefined`.
 */
export function parseClientHandshake(
  raw: string,
): ParsedClientHandshake | undefined {
  try {
    ensureGatewayMessagesRegistered();
    const data = JSON.parse(raw) as MessageData;
    const message = parseClientToBffMessage(data);

    if (!(message instanceof ClientHandshakeMessage)) {
      return undefined;
    }

    const { applicationId } = message.payload;
    if (applicationId.length === 0) {
      return undefined;
    }

    return { applicationId };
  } catch {
    return undefined;
  }
}
