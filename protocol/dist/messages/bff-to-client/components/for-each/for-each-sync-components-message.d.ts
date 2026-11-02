import type { ServerComponentConfig } from "../../../../types/server-component-config";
import { ReliableComponentCommandMessage } from "../../reliable-component-command-message";
export type ForEachSyncComponentsPayload = ServerComponentConfig[][];
export declare class ForEachSyncComponentsMessage extends ReliableComponentCommandMessage<ForEachSyncComponentsPayload> {
    readonly payload: ForEachSyncComponentsPayload;
    static readonly type = "for-each-sync-components";
    constructor(target: string, payload: ForEachSyncComponentsPayload);
}
