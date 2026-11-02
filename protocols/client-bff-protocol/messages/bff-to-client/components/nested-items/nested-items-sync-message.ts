import type { NestedItemBase } from "../../../../types/nested-item-base";
import { ReliableComponentCommandMessage } from "../../reliable-component-command-message";

export type NestedItemsSyncPayload = {
  slot: string;
  items: NestedItemBase[];
};

export class NestedItemsSyncMessage extends ReliableComponentCommandMessage<NestedItemsSyncPayload> {
  static readonly type = "nested-items-sync";
  constructor(
    target: string,
    public override readonly payload: NestedItemsSyncPayload,
  ) {
    super(target, payload);
  }
}
