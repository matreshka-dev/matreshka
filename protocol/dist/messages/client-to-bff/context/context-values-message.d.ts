import { ReliableTargetedClientToBffMessage } from "../reliable-client-to-bff-message";
export type ClientContextValueRecord = {
    key: string;
    value: unknown;
};
export declare class ContextValuesMessage extends ReliableTargetedClientToBffMessage<ClientContextValueRecord[]> {
    readonly payload: ClientContextValueRecord[];
    static readonly type = "context-values";
    constructor(target: string, payload: ClientContextValueRecord[]);
}
