import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type MobileGetBleServicesPayload = {
  deviceId: string;
};

export class MobileGetBleServicesMessage extends PingableTargetedBffToClientMessage<MobileGetBleServicesPayload> {
  static readonly type = "get-ble-services";
  constructor(
    public override readonly target: string,
    public override readonly payload: MobileGetBleServicesPayload,
  ) {
    super(target, payload);
  }
}
