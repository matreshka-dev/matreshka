import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
import type { MediaIdPayload } from "./media-id-payload";

export class MediaExitPictureInPictureMessage extends PingableTargetedBffToClientMessage<MediaIdPayload> {
  static readonly type = "media-exit-picture-in-picture";
  constructor(
    public override readonly target: string,
    public override readonly payload: MediaIdPayload,
  ) {
    super(target, payload);
  }
}
