import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class PopoverCloseMessage extends PingableComponentCommandMessage {
  static readonly type = "popover-close";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
