import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class BoardZoomInMessage extends PingableComponentCommandMessage {
  static readonly type = "board-zoom-in";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
