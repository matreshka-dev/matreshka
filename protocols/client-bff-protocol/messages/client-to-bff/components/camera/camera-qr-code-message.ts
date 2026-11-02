import { ComponentInteractionMessage } from "../component-interaction-message";

/**
 * Сообщение от клиента к BFF: распознан QR-код на камере.
 * payload содержит строковое значение QR-кода.
 */
export class CameraQrCodeMessage extends ComponentInteractionMessage<string> {
  static readonly type = "camera-qr-code";
  readonly eventType = "qr-code";
  constructor(target: string, payload: string) {
    super(target, payload);
  }
}
