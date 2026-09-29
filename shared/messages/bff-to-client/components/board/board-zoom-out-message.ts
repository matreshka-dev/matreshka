import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class BoardZoomOutMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "board-zoom-out";
  constructor(target: string) {
    super(target);
  }
}
