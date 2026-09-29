import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class BoardSetZoomMessage extends PingableComponentCommandMessage<number> {
  static readonly type = "board-set-zoom";
  constructor(
    public override readonly target: string,
    public override readonly payload: number,
  ) {
    super(target, payload);
  }
}
