import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export declare class PopoverCloseMessage extends PingableComponentCommandMessage {
    static readonly type = "popover-close";
    constructor(target: string, payload: ComponentCommandActionPayload);
}
