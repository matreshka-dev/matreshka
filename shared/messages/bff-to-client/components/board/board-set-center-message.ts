import type { BoardPoint } from "../../../../types/board-config";
import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export type BoardSetCenterPayload = ComponentCommandActionPayload & BoardPoint;

export class BoardSetCenterMessage extends PingableComponentCommandMessage<BoardSetCenterPayload> {
  static readonly type = "board-set-center";
  constructor(
    public override readonly target: string,
    public override readonly payload: BoardSetCenterPayload,
  ) {
    super(target, payload);
  }
}
