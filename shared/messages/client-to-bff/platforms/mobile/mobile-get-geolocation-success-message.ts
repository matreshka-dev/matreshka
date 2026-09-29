import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";

export type MobileGetGeolocationSuccessPayload = {
  latitude: number;
  longitude: number;
};

export class MobileGetGeolocationSuccessMessage extends PingableTargetedClientToBffMessage<MobileGetGeolocationSuccessPayload> {
  static readonly type = "mobile-platform-get-geolocation-success";
  constructor(
    public override readonly target: string,
    public override readonly payload: MobileGetGeolocationSuccessPayload,
  ) {
    super(target, payload);
  }
}
