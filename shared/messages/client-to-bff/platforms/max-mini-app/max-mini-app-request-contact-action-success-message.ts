import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";

export class MaxMiniAppRequestContactActionSuccessMessage extends PingableTargetedClientToBffMessage<unknown> {
  static readonly type = "max-mini-app-platform-request-contact-action-success";
  constructor(
    public override readonly target: string,
    public override readonly payload: unknown,
  ) {
    super(target, payload);
  }
}
