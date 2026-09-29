import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type MobileDisconnectPayload = {
  deviceId: string;
};

export class MobileDisconnectMessage extends PingableTargetedBffToClientMessage<MobileDisconnectPayload> {
  static readonly type = "disconnect";
  constructor(
    public override readonly target: string,
    public override readonly payload: MobileDisconnectPayload,
  ) {
    super(target, payload);
  }
}
