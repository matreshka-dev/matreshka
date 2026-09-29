import { PingableComponentCommandMessage } from "../../pingable-component-command-message";

export class MapSetZoomMessage extends PingableComponentCommandMessage<number> {
  static readonly type = "map-set-zoom";
  constructor(
    public override readonly target: string,
    public override readonly payload: number,
  ) {
    super(target, payload);
  }
}
