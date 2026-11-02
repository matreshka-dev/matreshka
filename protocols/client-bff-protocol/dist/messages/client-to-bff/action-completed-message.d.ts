import { PingableTargetedClientToBffMessage } from "./pingable-client-to-bff-message";
export declare class ActionCompletedMessage extends PingableTargetedClientToBffMessage<undefined> {
    readonly target: string;
    static readonly type = "action-completed";
    constructor(target: string);
}
