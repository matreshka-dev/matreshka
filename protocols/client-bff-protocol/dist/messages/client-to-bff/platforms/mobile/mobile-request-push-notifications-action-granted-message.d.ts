import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";
export type MobileRequestPushNotificationsGrantedPayload = {
    token: unknown;
};
export declare class MobileRequestPushNotificationsActionGrantedMessage extends PingableTargetedClientToBffMessage<MobileRequestPushNotificationsGrantedPayload> {
    readonly target: string;
    readonly payload: MobileRequestPushNotificationsGrantedPayload;
    static readonly type = "mobile-platform-request-push-notifications-action-granted";
    constructor(target: string, payload: MobileRequestPushNotificationsGrantedPayload);
}
