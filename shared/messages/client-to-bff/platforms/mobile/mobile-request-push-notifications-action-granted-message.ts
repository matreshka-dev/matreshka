import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";

export type MobileRequestPushNotificationsGrantedPayload = {
  token: unknown;
};

export class MobileRequestPushNotificationsActionGrantedMessage extends PingableTargetedClientToBffMessage<MobileRequestPushNotificationsGrantedPayload> {
  static readonly type =
    "mobile-platform-request-push-notifications-action-granted";
  constructor(
    public override readonly target: string,
    public override readonly payload: MobileRequestPushNotificationsGrantedPayload,
  ) {
    super(target, payload);
  }
}
