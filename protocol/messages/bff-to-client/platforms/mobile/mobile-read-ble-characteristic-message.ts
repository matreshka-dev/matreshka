import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type MobileReadBleCharacteristicPayload = {
  deviceId: string;
  serviceId: number | string;
  characteristicId: number | string;
};

export class MobileReadBleCharacteristicMessage extends PingableTargetedBffToClientMessage<MobileReadBleCharacteristicPayload> {
  static readonly type = "read-ble-characteristic";
  constructor(
    public override readonly target: string,
    public override readonly payload: MobileReadBleCharacteristicPayload,
  ) {
    super(target, payload);
  }
}
