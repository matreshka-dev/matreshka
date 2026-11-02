import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class BoardZoomInMessage extends PingableComponentCommandMessage {
  static readonly type = "board-zoom-in";
  constructor(target: string, payload: ComponentCommandActionPayload) {
    super(target, payload);
  }
}
