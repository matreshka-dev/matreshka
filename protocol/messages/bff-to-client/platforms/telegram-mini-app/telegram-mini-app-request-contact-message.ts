import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export class TelegramMiniAppRequestContactMessage extends PingableTargetedBffToClientMessage<undefined> {
  static readonly type = "telegram-mini-app-request-contact";
  constructor(public override readonly target: string) {
    super(target);
  }
}
