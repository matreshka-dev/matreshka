import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export type BoardSetZoomPayload = ComponentCommandActionPayload & {
  zoom: number;
};

export class BoardSetZoomMessage extends PingableComponentCommandMessage<BoardSetZoomPayload> {
  static readonly type = "board-set-zoom";
  constructor(
    public override readonly target: string,
    public override readonly payload: BoardSetZoomPayload,
  ) {
    super(target, payload);
  }
}
