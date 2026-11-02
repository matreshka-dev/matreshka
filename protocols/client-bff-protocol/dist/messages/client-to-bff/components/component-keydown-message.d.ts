import { ComponentInteractionMessage } from "./component-interaction-message";
export declare class ComponentKeyDownMessage extends ComponentInteractionMessage<{
    key: string;
}> {
    static readonly type = "component-keydown";
    readonly eventType = "keydown";
    constructor(target: string, payload: {
        key: string;
    });
}
