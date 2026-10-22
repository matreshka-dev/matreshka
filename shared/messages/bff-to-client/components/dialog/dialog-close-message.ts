import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class DialogCloseMessage extends PingableComponentCommandMessage {
  static readonly type = "dialog-close";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
