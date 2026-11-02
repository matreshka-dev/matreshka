import type { BoardPoint } from "../../../../types/board-config";
import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export type BoardSetCenterPayload = ComponentCommandActionPayload & BoardPoint;
export declare class BoardSetCenterMessage extends PingableComponentCommandMessage<BoardSetCenterPayload> {
    readonly target: string;
    readonly payload: BoardSetCenterPayload;
    static readonly type = "board-set-center";
    constructor(target: string, payload: BoardSetCenterPayload);
}
