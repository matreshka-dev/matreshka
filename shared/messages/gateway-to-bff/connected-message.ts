import { GatewayToBffMessage } from "./gateway-to-bff-message";

export type ConnectedPayload = {
  bffId: string;
  applicationIds: readonly string[];
};

/** Gateway → BFF: BFF успешно подключён. */
export class ConnectedMessage extends GatewayToBffMessage<ConnectedPayload> {
  static readonly type = "connected";

  constructor(public override readonly payload: ConnectedPayload) {
    super(payload);
  }
}
