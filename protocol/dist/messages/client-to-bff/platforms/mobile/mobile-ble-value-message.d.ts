import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";
export type MobileBleValuePayload = {
    value: number;
};
export declare class MobileBleValueMessage extends PingableTargetedClientToBffMessage<MobileBleValuePayload> {
    readonly target: string;
    readonly payload: MobileBleValuePayload;
    static readonly type = "value";
    constructor(target: string, payload: MobileBleValuePayload);
}
