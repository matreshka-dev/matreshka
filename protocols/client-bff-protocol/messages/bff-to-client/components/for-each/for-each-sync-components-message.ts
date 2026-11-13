import type { ForEachSyncComponentsPayload } from "../../../../types/for-each-config";
import { ReliableComponentCommandMessage } from "../../reliable-component-command-message";

export type {
  ForEachSyncComponentsPayload,
  ForEachSyncedItem,
} from "../../../../types/for-each-config";

export class ForEachSyncComponentsMessage extends ReliableComponentCommandMessage<ForEachSyncComponentsPayload> {
  static readonly type = "for-each-sync-components";
  constructor(
    target: string,
    public override readonly payload: ForEachSyncComponentsPayload,
  ) {
    super(target, payload);
  }
}
