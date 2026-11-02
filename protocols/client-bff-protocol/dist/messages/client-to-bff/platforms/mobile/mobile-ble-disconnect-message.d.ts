import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";
export declare class MobileBleDisconnectMessage extends PingableTargetedClientToBffMessage<{}> {
    readonly target: string;
    static readonly type = "disconnect";
    constructor(target: string);
}
