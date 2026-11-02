import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";

export type AppReconnectInfoPayload = { serverInstanceId: string };

export class AppReconnectInfoMessage extends PingableBffToClientMessage<AppReconnectInfoPayload> {
  static readonly type = "reconnect-info";
  constructor(public override readonly payload: AppReconnectInfoPayload) {
    super(payload);
  }
}
