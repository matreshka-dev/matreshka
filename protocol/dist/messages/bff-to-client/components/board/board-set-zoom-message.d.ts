import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export type BoardSetZoomPayload = ComponentCommandActionPayload & {
    zoom: number;
};
export declare class BoardSetZoomMessage extends PingableComponentCommandMessage<BoardSetZoomPayload> {
    readonly target: string;
    readonly payload: BoardSetZoomPayload;
    static readonly type = "board-set-zoom";
    constructor(target: string, payload: BoardSetZoomPayload);
}
