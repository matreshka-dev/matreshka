import { ComponentInteractionMessage } from "./component-interaction-message";
export type ComponentScrollPayload = {
    offset: number;
    viewportSize: number;
    contentSize: number;
};
export declare class ComponentScrollMessage extends ComponentInteractionMessage<ComponentScrollPayload> {
    static readonly type = "component-scroll";
    readonly eventType = "scroll";
    constructor(target: string, payload: ComponentScrollPayload);
}
