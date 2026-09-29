import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";

export type BrowserGetGeolocationSuccessPayload = {
  latitude: number;
  longitude: number;
};

export class BrowserGetGeolocationSuccessMessage extends PingableTargetedClientToBffMessage<BrowserGetGeolocationSuccessPayload> {
  static readonly type = "browser-platform-get-geolocation-success";
  constructor(
    public override readonly target: string,
    public override readonly payload: BrowserGetGeolocationSuccessPayload,
  ) {
    super(target, payload);
  }
}
