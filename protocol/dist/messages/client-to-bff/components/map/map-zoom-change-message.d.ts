import { ComponentInteractionMessage } from "../component-interaction-message";
export declare class MapZoomChangeMessage extends ComponentInteractionMessage<number> {
    readonly target: string;
    readonly payload: number;
    static readonly type = "map-zoom-change";
    readonly eventType = "zoom-change";
    constructor(target: string, payload: number);
}
