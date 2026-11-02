import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type BrowserRequestPushNotificationsPayload = {
    publicKey: string;
};
export declare class BrowserRequestPushNotificationsMessage extends PingableTargetedBffToClientMessage<BrowserRequestPushNotificationsPayload> {
    readonly target: string;
    readonly payload: BrowserRequestPushNotificationsPayload;
    static readonly type = "browser-request-push-notifications";
    constructor(target: string, payload: BrowserRequestPushNotificationsPayload);
}
