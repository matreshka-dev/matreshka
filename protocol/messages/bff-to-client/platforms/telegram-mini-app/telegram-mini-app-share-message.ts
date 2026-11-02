import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export type TelegramMiniAppSharePayload = {
  url?: string;
  title?: string;
  text?: string;
};

export class TelegramMiniAppShareMessage extends PingableTargetedBffToClientMessage<TelegramMiniAppSharePayload> {
  static readonly type = "telegram-mini-app-share";
  constructor(
    public override readonly target: string,
    public override readonly payload: TelegramMiniAppSharePayload,
  ) {
    super(target, payload);
  }
}
