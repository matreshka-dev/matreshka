import type { DialogConfig } from "../../../../types/dialog-config";
import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export declare class DialogShowMessage extends PingableTargetedBffToClientMessage<DialogConfig> {
    readonly target: string;
    readonly payload: DialogConfig;
    static readonly type = "show-dialog";
    constructor(target: string, payload: DialogConfig);
}
