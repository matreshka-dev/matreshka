import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export class EnablePrivacyModeMessage extends PingableTargetedBffToClientMessage<undefined> {
  static readonly type = "enable-privacy-mode";
  constructor(public override readonly target: string) {
    super(target);
  }
}
