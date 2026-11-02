import { ComponentInteractionMessage } from "../component-interaction-message";
export declare class BoardZoomChangeMessage extends ComponentInteractionMessage<number> {
    readonly target: string;
    readonly payload: number;
    static readonly type = "board-zoom-change";
    readonly eventType = "zoom-change";
    constructor(target: string, payload: number);
}
