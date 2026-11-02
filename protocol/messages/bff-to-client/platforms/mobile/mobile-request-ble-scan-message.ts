import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type MobileRequestBleScanPayload = {
  services?: (number | string)[];
  name?: string;
  namePrefix?: string;
};

export class MobileRequestBleScanMessage extends PingableTargetedBffToClientMessage<MobileRequestBleScanPayload> {
  static readonly type = "request-ble-scan";
  constructor(
    public override readonly target: string,
    public override readonly payload: MobileRequestBleScanPayload,
  ) {
    super(target, payload);
  }
}
