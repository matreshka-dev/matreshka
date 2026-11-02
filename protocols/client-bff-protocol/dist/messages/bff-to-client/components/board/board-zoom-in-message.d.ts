import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export declare class BoardZoomInMessage extends PingableComponentCommandMessage {
    static readonly type = "board-zoom-in";
    constructor(target: string, payload: ComponentCommandActionPayload);
}
