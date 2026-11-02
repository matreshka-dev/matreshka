import type { BoardPoint } from "../../../../types/board-config";
import { ComponentInteractionMessage } from "../component-interaction-message";

/**
 * Событие от клиента к BFF: изменился центр вида доски.
 */
export class BoardCenterChangeMessage extends ComponentInteractionMessage<BoardPoint> {
  static readonly type = "board-center-change";
  readonly eventType = "center-change";
  constructor(
    public override readonly target: string,
    public override readonly payload: BoardPoint,
  ) {
    super(target, payload);
  }
}
