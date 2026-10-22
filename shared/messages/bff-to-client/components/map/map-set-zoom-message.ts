import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export type MapSetZoomPayload = ComponentCommandActionPayload & {
  zoom: number;
};

export class MapSetZoomMessage extends PingableComponentCommandMessage<MapSetZoomPayload> {
  static readonly type = "map-set-zoom";
  constructor(
    public override readonly target: string,
    public override readonly payload: MapSetZoomPayload,
  ) {
    super(target, payload);
  }
}
