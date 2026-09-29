import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";

export class MobileBleReceiveMessage extends PingableTargetedClientToBffMessage<unknown> {
  static readonly type = "receive";
  constructor(
    public override readonly target: string,
    public override readonly payload: unknown,
  ) {
    super(target, payload);
  }
}
