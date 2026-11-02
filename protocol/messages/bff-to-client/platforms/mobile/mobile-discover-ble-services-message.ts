import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type MobileDiscoverBleServicesPayload = {
  deviceId: string;
};

export class MobileDiscoverBleServicesMessage extends PingableTargetedBffToClientMessage<MobileDiscoverBleServicesPayload> {
  static readonly type = "discover-ble-services";
  constructor(
    public override readonly target: string,
    public override readonly payload: MobileDiscoverBleServicesPayload,
  ) {
    super(target, payload);
  }
}
