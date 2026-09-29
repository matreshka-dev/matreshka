import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class DialogCloseMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "dialog-close";
  constructor(target: string) {
    super(target);
  }
}
