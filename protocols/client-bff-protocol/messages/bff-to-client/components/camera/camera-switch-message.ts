import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

/**
 * Команда от BFF к клиенту: переключить активную камеру устройства на указанную.
 */
export type CameraSwitchPayload = ComponentCommandActionPayload & {
  deviceId: string;
};

export class CameraSwitchMessage extends PingableComponentCommandMessage<CameraSwitchPayload> {
  static readonly type = "camera-switch";
  constructor(
    public override readonly target: string,
    public override readonly payload: CameraSwitchPayload,
  ) {
    super(target, payload);
  }
}
