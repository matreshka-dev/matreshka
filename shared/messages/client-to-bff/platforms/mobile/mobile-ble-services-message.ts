import { MobileBleService } from "../../../../types/mobile-ble-services";
import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";

export type MobileBleServicesPayload = {
  services: MobileBleService[];
};

export class MobileBleServicesMessage extends PingableTargetedClientToBffMessage<MobileBleServicesPayload> {
  static readonly type = "mobile-platform-ble-services";
  constructor(
    public override readonly target: string,
    public override readonly payload: MobileBleServicesPayload,
  ) {
    super(target, payload);
  }
}
