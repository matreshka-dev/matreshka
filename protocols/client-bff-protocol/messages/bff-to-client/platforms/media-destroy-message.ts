import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
import type { MediaIdPayload } from "./media-id-payload";

export class MediaDestroyMessage extends PingableTargetedBffToClientMessage<MediaIdPayload> {
  static readonly type = "media-destroy";
  constructor(
    public override readonly target: string,
    public override readonly payload: MediaIdPayload,
  ) {
    super(target, payload);
  }
}
