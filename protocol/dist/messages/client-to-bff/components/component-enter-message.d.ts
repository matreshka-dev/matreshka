import { ComponentInteractionMessage } from "./component-interaction-message";
export declare class ComponentEnterMessage extends ComponentInteractionMessage<undefined> {
    static readonly type = "component-enter";
    readonly eventType = "enter";
    constructor(target: string);
}
