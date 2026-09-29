import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class PopoverCloseMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "popover-close";
  constructor(target: string) {
    super(target);
  }
}
