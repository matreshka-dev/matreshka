import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";

export class EnablePrivacyModeMessage extends PingableBffToClientMessage<undefined> {
  static readonly type = "enable-privacy-mode";
  constructor() {
    super();
  }
}
