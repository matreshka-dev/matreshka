import type { NestedItemBase } from "../../../../types/nested-item-base";
import { ReliableComponentCommandMessage } from "../../reliable-component-command-message";
export type NestedItemsSyncPayload = {
    slot: string;
    items: NestedItemBase[];
};
export declare class NestedItemsSyncMessage extends ReliableComponentCommandMessage<NestedItemsSyncPayload> {
    readonly payload: NestedItemsSyncPayload;
    static readonly type = "nested-items-sync";
    constructor(target: string, payload: NestedItemsSyncPayload);
}
