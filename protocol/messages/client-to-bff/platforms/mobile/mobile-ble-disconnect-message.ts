import { PingableTargetedClientToBffMessage } from "../../pingable-client-to-bff-message";

export class MobileBleDisconnectMessage extends PingableTargetedClientToBffMessage<{}> {
  static readonly type = "disconnect";
  constructor(public override readonly target: string) {
    super(target, {});
  }
}
