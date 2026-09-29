import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";

export class AppReloadMessage extends PingableBffToClientMessage<undefined> {
  static readonly type = "reload";
  constructor() {
    super(undefined);
  }
}
