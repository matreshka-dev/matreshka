import { ComponentInteractionMessage } from "./component-interaction-message";
export declare class ComponentHideMessage extends ComponentInteractionMessage<undefined> {
    static readonly type = "component-hide";
    readonly eventType = "hide";
    constructor(target: string);
}
