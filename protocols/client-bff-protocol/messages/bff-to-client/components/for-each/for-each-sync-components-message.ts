import type { ServerComponentConfig } from "../../../../types/server-component-config";
import { ReliableComponentCommandMessage } from "../../reliable-component-command-message";

/** Сериализованные конфиги строк ForEach: каждая строка — массив компонентов. */
export type ForEachSyncComponentsPayload = ServerComponentConfig[][];

export class ForEachSyncComponentsMessage extends ReliableComponentCommandMessage<ForEachSyncComponentsPayload> {
  static readonly type = "for-each-sync-components";
  constructor(
    target: string,
    public override readonly payload: ForEachSyncComponentsPayload,
  ) {
    super(target, payload);
  }
}
