import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class DialogCloseMessage extends PingableComponentCommandMessage {
  static readonly type = "dialog-close";
  constructor(target: string, payload: ComponentCommandActionPayload) {
    super(target, payload);
  }
}
