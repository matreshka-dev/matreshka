import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class MapZoomInMessage extends PingableComponentCommandMessage {
  static readonly type = "map-zoom-in";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
