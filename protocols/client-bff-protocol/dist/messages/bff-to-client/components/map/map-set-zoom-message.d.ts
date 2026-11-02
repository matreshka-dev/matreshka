import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export type MapSetZoomPayload = ComponentCommandActionPayload & {
    zoom: number;
};
export declare class MapSetZoomMessage extends PingableComponentCommandMessage<MapSetZoomPayload> {
    readonly target: string;
    readonly payload: MapSetZoomPayload;
    static readonly type = "map-set-zoom";
    constructor(target: string, payload: MapSetZoomPayload);
}
