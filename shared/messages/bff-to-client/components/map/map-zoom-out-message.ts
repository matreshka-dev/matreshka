import type { ComponentCommandActionPayload } from "../../component-command-message";
import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class MapZoomOutMessage extends PingableComponentCommandMessage {
  static readonly type = "map-zoom-out";
  constructor(target: string, payload: ComponentCommandActionPayload) {
    super(target, payload);
  }
}
