import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type MobileConnectToBleDevicePayload = {
  deviceId: string;
};

export class MobileConnectToBleDeviceMessage extends PingableTargetedBffToClientMessage<MobileConnectToBleDevicePayload> {
  static readonly type = "connect-to-ble-device";
  constructor(
    public override readonly target: string,
    public override readonly payload: MobileConnectToBleDevicePayload,
  ) {
    super(target, payload);
  }
}
