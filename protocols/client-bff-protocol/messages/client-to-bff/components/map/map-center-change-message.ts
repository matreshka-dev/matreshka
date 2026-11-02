import { ComponentInteractionMessage } from "../component-interaction-message";

export type MapCenterChangePayload = {
  latitude: number;
  longitude: number;
  /** Высота над эллипсоидом WGS84, м (третий элемент `center` в Yandex Maps API v3). */
  altitude?: number;
};

/**
 * Событие от клиента к BFF: изменился центр карты.
 */
export class MapCenterChangeMessage extends ComponentInteractionMessage<MapCenterChangePayload> {
  static readonly type = "map-center-change";
  readonly eventType = "center-change";
  constructor(
    public override readonly target: string,
    public override readonly payload: MapCenterChangePayload,
  ) {
    super(target, payload);
  }
}
