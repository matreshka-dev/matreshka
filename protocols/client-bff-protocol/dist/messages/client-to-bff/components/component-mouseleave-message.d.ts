import { ComponentInteractionMessage } from "./component-interaction-message";
export declare class ComponentMouseLeaveMessage extends ComponentInteractionMessage<undefined> {
    static readonly type = "component-mouseleave";
    readonly eventType = "mouseleave";
    constructor(target: string);
}
