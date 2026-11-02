import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export class DisablePrivacyModeMessage extends PingableTargetedBffToClientMessage<undefined> {
  static readonly type = "disable-privacy-mode";
  constructor(public override readonly target: string) {
    super(target);
  }
}
