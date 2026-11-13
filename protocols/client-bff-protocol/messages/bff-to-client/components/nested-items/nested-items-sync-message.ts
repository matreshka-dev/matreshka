import type { NestedItemBase } from "../../../../types/nested-item-base";
import { ReliableComponentCommandMessage } from "../../reliable-component-command-message";

/** Полный порядок id слота и элементы, которых у этого instance клиента ещё нет. */
export type NestedItemsSyncPayload = {
  slot: string;
  order: string[];
  upserts: NestedItemBase[];
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
