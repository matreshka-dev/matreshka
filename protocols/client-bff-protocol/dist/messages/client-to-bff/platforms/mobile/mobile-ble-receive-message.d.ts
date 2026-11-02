import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";
export declare class MobileBleReceiveMessage extends PingableTargetedClientToBffMessage<unknown> {
    readonly target: string;
    readonly payload: unknown;
    static readonly type = "receive";
    constructor(target: string, payload: unknown);
}
