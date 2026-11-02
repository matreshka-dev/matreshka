import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";
export declare class MobileBleConnectMessage extends PingableTargetedClientToBffMessage<undefined> {
    readonly target: string;
    static readonly type = "connect";
    constructor(target: string);
}
