import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class MapZoomOutMessage extends PingableComponentCommandMessage {
  static readonly type = "map-zoom-out";
  constructor(target: string, actionScope: string) {
    super(target, { actionScope });
  }
}
