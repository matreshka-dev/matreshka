import type { ComponentCommandActionPayload } from "../component-command-message";
import { PingableComponentCommandMessage } from "../pingable-component-command-message";
export type ComponentScrollToPayload = ComponentCommandActionPayload & {
    value: number;
    smooth?: boolean;
};
export declare class ComponentScrollToMessage extends PingableComponentCommandMessage<ComponentScrollToPayload> {
    readonly target: string;
    readonly payload: ComponentScrollToPayload;
    static readonly type = "component-scroll-to";
    constructor(target: string, payload: ComponentScrollToPayload);
}
