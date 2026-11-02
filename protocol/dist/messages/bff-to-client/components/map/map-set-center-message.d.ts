import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";
export type MapSetCenterPayload = ComponentCommandActionPayload & {
    latitude: number;
    longitude: number;
    altitude?: number;
};
export declare class MapSetCenterMessage extends PingableComponentCommandMessage<MapSetCenterPayload> {
    readonly target: string;
    readonly payload: MapSetCenterPayload;
    static readonly type = "map-set-center";
    constructor(target: string, payload: MapSetCenterPayload);
}
