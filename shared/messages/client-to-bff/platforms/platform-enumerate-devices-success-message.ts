import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";

export type PlatformEnumeratedDeviceKind =
  | "audioinput"
  | "audiooutput"
  | "videoinput";

/**
 * Нормализованное представление устройства, чтобы не дублировать MediaDeviceInfo / InputDeviceInfo.
 * - `kind` уже однозначно показывает input/output (`audiooutput` = output).
 * - `capabilities/settings` заполняются только если доступны (обычно для input устройств).
 */
export type PlatformEnumeratedDevice = {
  kind: PlatformEnumeratedDeviceKind;
  deviceId: string;
  groupId: string;
  label?: string;
  capabilities?: Record<string, unknown>;
  settings?: Record<string, unknown>;
};

export type PlatformEnumerateDevicesSuccessPayload = {
  devices: PlatformEnumeratedDevice[];
};

export class PlatformEnumerateDevicesSuccessMessage extends PingableTargetedClientToBffMessage<PlatformEnumerateDevicesSuccessPayload> {
  static readonly type = "platform-enumerate-devices-success";
  constructor(
    public override readonly target: string,
    public override readonly payload: PlatformEnumerateDevicesSuccessPayload,
  ) {
    super(target, payload);
  }
}
