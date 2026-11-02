import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";
export declare class AppBackMessage extends PingableBffToClientMessage<undefined> {
    static readonly type = "back";
    constructor();
}
