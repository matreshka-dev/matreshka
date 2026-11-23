import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
import type { MediaIdPayload } from "./media-id-payload";

export class MediaLoadMessage extends PingableTargetedBffToClientMessage<MediaIdPayload> {
  static readonly type = "media-load";
  constructor(
    public override readonly target: string,
    public override readonly payload: MediaIdPayload,
  ) {
    super(target, payload);
  }
}
