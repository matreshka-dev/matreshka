import { ReliableClientToBffMessage } from "../reliable-client-to-bff-message";

export type ClientHandshakePayload = {
  applicationId: string;
};

export class HandshakeMessage extends ReliableClientToBffMessage<ClientHandshakePayload> {
  static readonly type = "handshake";
  constructor(public override readonly payload: ClientHandshakePayload) {
    super(payload);
  }
}
