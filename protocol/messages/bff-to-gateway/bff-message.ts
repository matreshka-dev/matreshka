import { BffToGatewayMessage } from "./bff-to-gateway-message";

export type BffMessagePayload = {
  sessionId: string;
  message: string;
};

/** BFF → gateway: сообщение клиенту (opaque JSON string). */
export class BffMessage extends BffToGatewayMessage<BffMessagePayload> {
  static readonly type = "bff-message";

  constructor(public override readonly payload: BffMessagePayload) {
    super(payload);
  }
}
