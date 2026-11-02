import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";
export declare class AppReloadMessage extends PingableBffToClientMessage<undefined> {
    static readonly type = "reload";
    constructor();
}
