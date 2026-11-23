import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type MediaSetPlaybackRatePayload = {
  mediaId: string;
  playbackRate: number;
};

export class MediaSetPlaybackRateMessage extends PingableTargetedBffToClientMessage<MediaSetPlaybackRatePayload> {
  static readonly type = "media-set-playback-rate";
  constructor(
    public override readonly target: string,
    public override readonly payload: MediaSetPlaybackRatePayload,
  ) {
    super(target, payload);
  }
}
