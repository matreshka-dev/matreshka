import type { BoardPoint } from "../../../../types/board-config";
import { ComponentInteractionMessage } from "../component-interaction-message";
export declare class BoardCenterChangeMessage extends ComponentInteractionMessage<BoardPoint> {
    readonly target: string;
    readonly payload: BoardPoint;
    static readonly type = "board-center-change";
    readonly eventType = "center-change";
    constructor(target: string, payload: BoardPoint);
}
