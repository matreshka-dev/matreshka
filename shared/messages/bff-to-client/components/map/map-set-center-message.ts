import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export type MapSetCenterPayload = {
  latitude: number;
  longitude: number;
  /** Высота над эллипсоидом WGS84, м (третий элемент `center` в Yandex Maps API v3). */
  altitude?: number;
};

export class MapSetCenterMessage extends PingableComponentCommandMessage<MapSetCenterPayload> {
  static readonly type = "map-set-center";
  constructor(
    public override readonly target: string,
    public override readonly payload: MapSetCenterPayload,
  ) {
    super(target, payload);
  }
}
