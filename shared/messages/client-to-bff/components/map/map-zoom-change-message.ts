import { ComponentInteractionMessage } from "../component-interaction-message";

/**
 * Событие от клиента к BFF: изменился zoom карты.
 */
export class MapZoomChangeMessage extends ComponentInteractionMessage<number> {
  static readonly type = "map-zoom-change";
  readonly eventType = "zoom-change";
  constructor(
    public override readonly target: string,
    public override readonly payload: number,
  ) {
    super(target, payload);
  }
}
