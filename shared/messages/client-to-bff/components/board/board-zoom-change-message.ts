import { ComponentInteractionMessage } from "../component-interaction-message";

/**
 * Событие от клиента к BFF: изменился zoom доски.
 */
export class BoardZoomChangeMessage extends ComponentInteractionMessage<number> {
  static readonly type = "board-zoom-change";
  readonly eventType = "zoom-change";
  constructor(
    public override readonly target: string,
    public override readonly payload: number,
  ) {
    super(target, payload);
  }
}
