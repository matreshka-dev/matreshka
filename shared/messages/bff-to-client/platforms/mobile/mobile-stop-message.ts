import { PingableTargetedBffToClientMessage } from "../../pingable-bff-to-client-message";

export class MobileStopMessage extends PingableTargetedBffToClientMessage<undefined> {
  static readonly type = "stop";
  constructor(public override readonly target: string) {
    super(target);
  }
}
