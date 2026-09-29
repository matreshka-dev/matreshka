import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";

export class DisablePrivacyModeMessage extends PingableBffToClientMessage<undefined> {
  static readonly type = "disable-privacy-mode";
  constructor() {
    super();
  }
}
