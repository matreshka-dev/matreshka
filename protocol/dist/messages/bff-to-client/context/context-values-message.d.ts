import { ReliableTargetedBffToClientMessage } from "../reliable-bff-to-client-message";
export type ContextValueRecord = {
    key: string;
    value: unknown;
};
export declare class ContextValuesMessage extends ReliableTargetedBffToClientMessage<ContextValueRecord[]> {
    readonly payload: ContextValueRecord[];
    static readonly type = "context-values";
    constructor(target: string, payload: ContextValueRecord[]);
}
