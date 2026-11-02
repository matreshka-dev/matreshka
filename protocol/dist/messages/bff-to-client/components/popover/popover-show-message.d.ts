import type { PopoverConfig } from "../../../../types/popover-config";
import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type PopoverShowPayload = {
    source: string;
    anchor?: string;
    popover: PopoverConfig;
};
export declare class PopoverShowMessage extends PingableTargetedBffToClientMessage<PopoverShowPayload> {
    readonly target: string;
    readonly payload: PopoverShowPayload;
    static readonly type = "show-popover";
    constructor(target: string, payload: PopoverShowPayload);
}
