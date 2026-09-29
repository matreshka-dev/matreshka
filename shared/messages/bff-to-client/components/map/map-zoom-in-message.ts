import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class MapZoomInMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "map-zoom-in";
  constructor(target: string) {
    super(target);
  }
}
