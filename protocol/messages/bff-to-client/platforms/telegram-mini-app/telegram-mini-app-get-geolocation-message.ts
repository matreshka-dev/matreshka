import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export class TelegramMiniAppGetGeolocationMessage extends PingableTargetedBffToClientMessage<undefined> {
  static readonly type = "telegram-mini-app-get-geolocation";
  constructor(public override readonly target: string) {
    super(target);
  }
}
