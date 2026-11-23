import { MediaPreload } from "../../../enums/media-preload";
import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type MediaSetPreloadPayload = {
  mediaId: string;
  preload: MediaPreload;
};

export class MediaSetPreloadMessage extends PingableTargetedBffToClientMessage<MediaSetPreloadPayload> {
  static readonly type = "media-set-preload";
  constructor(
    public override readonly target: string,
    public override readonly payload: MediaSetPreloadPayload,
  ) {
    super(target, payload);
  }
}
