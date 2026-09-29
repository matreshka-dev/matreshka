import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";

export type BrowserRequestPushNotificationsGrantedPayload = {
  subscription: unknown;
};

export class BrowserRequestPushNotificationsActionGrantedMessage extends PingableTargetedClientToBffMessage<BrowserRequestPushNotificationsGrantedPayload> {
  static readonly type =
    "browser-platform-request-push-notifications-action-granted";
  constructor(
    public override readonly target: string,
    public override readonly payload: BrowserRequestPushNotificationsGrantedPayload,
  ) {
    super(target, payload);
  }
}
