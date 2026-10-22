import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class BoardZoomOutMessage extends PingableComponentCommandMessage {
  static readonly type = "board-zoom-out";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
