import { PingableBffToClientMessage } from "../pingable-bff-to-client-message";

export class AppBackMessage extends PingableBffToClientMessage<undefined> {
  static readonly type = "back";
  constructor() {
    super(undefined);
  }
}
