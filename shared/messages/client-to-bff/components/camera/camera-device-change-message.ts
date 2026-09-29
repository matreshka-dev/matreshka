import { ComponentInteractionMessage } from "../component-interaction-message";

export type CameraDeviceChangePayload = {
  deviceId: string;
};

/**
 * Событие от клиента к BFF: активный девайс камеры изменился.
 */
export class CameraDeviceChangeMessage extends ComponentInteractionMessage<CameraDeviceChangePayload> {
  static readonly type = "camera-device-change";
  readonly eventType = "device-change";
  constructor(
    public override readonly target: string,
    public override readonly payload: CameraDeviceChangePayload,
  ) {
    super(target, payload);
  }
}
