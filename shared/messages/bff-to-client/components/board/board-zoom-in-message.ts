import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class BoardZoomInMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "board-zoom-in";
  constructor(target: string) {
    super(target);
  }
}
