import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type MobileRequestBleScanPayload = {
    services?: (number | string)[];
    name?: string;
    namePrefix?: string;
};
export declare class MobileRequestBleScanMessage extends PingableTargetedBffToClientMessage<MobileRequestBleScanPayload> {
    readonly target: string;
    readonly payload: MobileRequestBleScanPayload;
    static readonly type = "request-ble-scan";
    constructor(target: string, payload: MobileRequestBleScanPayload);
}
