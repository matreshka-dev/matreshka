import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export class BrowserGetGeolocationMessage extends PingableTargetedBffToClientMessage<undefined> {
  static readonly type = "browser-get-geolocation";
  constructor(public override readonly target: string) {
    super(target);
  }
}
