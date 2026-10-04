import { HandshakeMessage as BffHandshakeMessage } from "@matreshka/shared/messages/bff-to-client/app/handshake-message";
import { HandshakeMessage as ClientHandshakeMessage } from "@matreshka/shared/messages/client-to-bff/app/handshake-message";

/** Сериализует client handshake так же, как это делает клиент. */
export function serializeClientHandshake(applicationId: string): string {
  const message = new ClientHandshakeMessage({ applicationId });
  return JSON.stringify(message.toJSON());
}

/** Сериализует BFF handshake с минимально валидным payload для тестов. */
export function serializeBffHandshake(token: string): string {
  const message = new BffHandshakeMessage({
    serverInstanceId: "srv",
    token,
    clientDestroyTimeoutMs: 900_000,
    settings: {
      appName: "Test",
      fonts: {},
      colors: { registry: {}, default: {} },
    },
  });
  return JSON.stringify(message.toJSON());
}
