import { ComponentInteractionMessage } from "../component-interaction-message";
export type MapCenterChangePayload = {
    latitude: number;
    longitude: number;
    altitude?: number;
};
export declare class MapCenterChangeMessage extends ComponentInteractionMessage<MapCenterChangePayload> {
    readonly target: string;
    readonly payload: MapCenterChangePayload;
    static readonly type = "map-center-change";
    readonly eventType = "center-change";
    constructor(target: string, payload: MapCenterChangePayload);
}
