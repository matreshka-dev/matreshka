import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
import type { MediaIdPayload } from "./media-id-payload";

export class MediaPlayMessage extends PingableTargetedBffToClientMessage<MediaIdPayload> {
  static readonly type = "media-play";
  constructor(
    public override readonly target: string,
    public override readonly payload: MediaIdPayload,
  ) {
    super(target, payload);
  }
}
