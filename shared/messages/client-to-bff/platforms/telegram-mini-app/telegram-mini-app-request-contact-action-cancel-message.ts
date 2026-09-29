import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";

export class TelegramMiniAppRequestContactActionCancelMessage extends PingableTargetedClientToBffMessage<{}> {
  static readonly type =
    "telegram-mini-app-platform-request-contact-action-cancel";
  constructor(public override readonly target: string) {
    super(target, {});
  }
}
