import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export declare class BoardZoomOutMessage extends PingableComponentCommandMessage {
    static readonly type = "board-zoom-out";
    constructor(target: string, payload: ComponentCommandActionPayload);
}
