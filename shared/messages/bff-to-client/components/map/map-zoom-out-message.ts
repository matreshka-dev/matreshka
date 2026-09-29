import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class MapZoomOutMessage extends PingableComponentCommandMessage<undefined> {
  static readonly type = "map-zoom-out";
  constructor(target: string) {
    super(target);
  }
}
