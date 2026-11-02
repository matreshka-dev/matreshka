import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";
export type MobileReadBleCharacteristicPayload = {
    deviceId: string;
    serviceId: number | string;
    characteristicId: number | string;
};
export declare class MobileReadBleCharacteristicMessage extends PingableTargetedBffToClientMessage<MobileReadBleCharacteristicPayload> {
    readonly target: string;
    readonly payload: MobileReadBleCharacteristicPayload;
    static readonly type = "read-ble-characteristic";
    constructor(target: string, payload: MobileReadBleCharacteristicPayload);
}
