import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type MediaSetVolumePayload = {
  mediaId: string;
  volume: number;
};

export class MediaSetVolumeMessage extends PingableTargetedBffToClientMessage<MediaSetVolumePayload> {
  static readonly type = "media-set-volume";
  constructor(
    public override readonly target: string,
    public override readonly payload: MediaSetVolumePayload,
  ) {
    super(target, payload);
  }
}
