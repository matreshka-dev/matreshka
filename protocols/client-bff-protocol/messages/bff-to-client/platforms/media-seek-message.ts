import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type MediaSeekPayload = {
  mediaId: string;
  time: number;
};

export class MediaSeekMessage extends PingableTargetedBffToClientMessage<MediaSeekPayload> {
  static readonly type = "media-seek";
  constructor(
    public override readonly target: string,
    public override readonly payload: MediaSeekPayload,
  ) {
    super(target, payload);
  }
}
