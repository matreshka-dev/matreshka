import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";

export class MobileBleConnectMessage extends PingableTargetedClientToBffMessage<undefined> {
  static readonly type = "connect";
  constructor(public override readonly target: string) {
    super(target);
  }
}
