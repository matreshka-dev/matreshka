import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type MobileSharePayload = {
    url?: string;
    title?: string;
    text?: string;
};
export declare class MobileShareMessage extends PingableTargetedBffToClientMessage<MobileSharePayload> {
    readonly target: string;
    readonly payload: MobileSharePayload;
    static readonly type = "mobile-share";
    constructor(target: string, payload: MobileSharePayload);
}
