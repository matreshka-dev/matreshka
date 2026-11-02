import { MobileBleService } from "../../../../types/mobile-ble-services";
import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";
export type MobileBleServicesPayload = {
    services: MobileBleService[];
};
export declare class MobileBleServicesMessage extends PingableTargetedClientToBffMessage<MobileBleServicesPayload> {
    readonly target: string;
    readonly payload: MobileBleServicesPayload;
    static readonly type = "mobile-platform-ble-services";
    constructor(target: string, payload: MobileBleServicesPayload);
}
