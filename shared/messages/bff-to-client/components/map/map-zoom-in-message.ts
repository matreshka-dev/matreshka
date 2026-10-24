import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class MapZoomInMessage extends PingableComponentCommandMessage {
  static readonly type = "map-zoom-in";
  constructor(target: string, payload: ComponentCommandActionPayload) {
    super(target, payload);
  }
}
