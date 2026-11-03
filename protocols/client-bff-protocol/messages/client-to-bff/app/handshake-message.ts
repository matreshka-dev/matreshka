import { packageVersion } from "../../../package-version";
import { ReliableClientToBffMessage } from "../reliable-client-to-bff-message";

export type ClientHandshakePayload = {
  applicationId: string;
  protocolVersion: string;
};

export type ClientHandshakeInput = Omit<
  ClientHandshakePayload,
  "protocolVersion"
>;

export class HandshakeMessage extends ReliableClientToBffMessage<ClientHandshakePayload> {
  static readonly type = "handshake";
  declare readonly payload: ClientHandshakePayload;
  constructor(input: ClientHandshakeInput) {
    super({ ...input, protocolVersion: packageVersion });
  }
}
