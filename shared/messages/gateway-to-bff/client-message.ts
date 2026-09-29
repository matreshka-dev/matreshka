import { GatewayToBffMessage } from "./gateway-to-bff-message";

export type ClientMessagePayload = {
  sessionId: string;
  message: string;
};

/** Gateway → BFF: сообщение от клиента (opaque JSON string). */
export class ClientMessage extends GatewayToBffMessage<ClientMessagePayload> {
  static readonly type = "client-message";

  constructor(public override readonly payload: ClientMessagePayload) {
    super(payload);
  }
}
