import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export declare class MobileRequestPushNotificationsMessage extends PingableTargetedBffToClientMessage<undefined> {
    readonly target: string;
    static readonly type = "mobile-request-push-notifications";
    constructor(target: string);
}
