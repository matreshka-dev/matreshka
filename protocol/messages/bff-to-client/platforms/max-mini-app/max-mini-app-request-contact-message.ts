import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export class MaxMiniAppRequestContactMessage extends PingableTargetedBffToClientMessage<undefined> {
  static readonly type = "max-mini-app-request-contact";
  constructor(public override readonly target: string) {
    super(target);
  }
}
