import type { BoardPoint } from "../../../../types/board-config";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class BoardSetCenterMessage extends PingableComponentCommandMessage<BoardPoint> {
  static readonly type = "board-set-center";
  constructor(
    public override readonly target: string,
    public override readonly payload: BoardPoint,
  ) {
    super(target, payload);
  }
}
