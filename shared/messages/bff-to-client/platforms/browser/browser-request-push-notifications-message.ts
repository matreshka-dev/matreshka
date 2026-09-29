import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type BrowserRequestPushNotificationsPayload = {
  publicKey: string;
};

export class BrowserRequestPushNotificationsMessage extends PingableTargetedBffToClientMessage<BrowserRequestPushNotificationsPayload> {
  static readonly type = "browser-request-push-notifications";
  constructor(
    public override readonly target: string,
    public override readonly payload: BrowserRequestPushNotificationsPayload,
  ) {
    super(target, payload);
  }
}
