import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export class MobileRequestPushNotificationsMessage extends PingableTargetedBffToClientMessage<undefined> {
  static readonly type = "mobile-request-push-notifications";
  constructor(public override readonly target: string) {
    super(target);
  }
}
