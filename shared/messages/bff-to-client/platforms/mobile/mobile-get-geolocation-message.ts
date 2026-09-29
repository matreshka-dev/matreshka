import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export class MobileGetGeolocationMessage extends PingableTargetedBffToClientMessage<undefined> {
  static readonly type = "mobile-get-geolocation";
  constructor(public override readonly target: string) {
    super(target);
  }
}
