import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";
export type BrowserRequestPushNotificationsGrantedPayload = {
    subscription: unknown;
};
export declare class BrowserRequestPushNotificationsActionGrantedMessage extends PingableTargetedClientToBffMessage<BrowserRequestPushNotificationsGrantedPayload> {
    readonly target: string;
    readonly payload: BrowserRequestPushNotificationsGrantedPayload;
    static readonly type = "browser-platform-request-push-notifications-action-granted";
    constructor(target: string, payload: BrowserRequestPushNotificationsGrantedPayload);
}
