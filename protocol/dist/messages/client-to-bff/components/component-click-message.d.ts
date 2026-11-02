import { ComponentInteractionMessage } from "./component-interaction-message";
export declare class ComponentClickMessage extends ComponentInteractionMessage<{}> {
    static readonly type = "component-click";
    readonly eventType = "click";
    constructor(target: string);
}
