import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

/**
 * Запрос от BFF к клиенту: вернуть список доступных media-устройств через MediaDevices.enumerateDevices().
 * Ответ приходит отдельным сообщением с тем же target.
 */
export class PlatformEnumerateDevicesMessage extends PingableTargetedBffToClientMessage<undefined> {
  static readonly type = "platform-enumerate-devices";
  constructor(public override readonly target: string) {
    super(target);
  }
}
