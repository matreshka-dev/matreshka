import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type MediaSetMutedPayload = {
  mediaId: string;
  muted: boolean;
};

export class MediaSetMutedMessage extends PingableTargetedBffToClientMessage<MediaSetMutedPayload> {
  static readonly type = "media-set-muted";
  constructor(
    public override readonly target: string,
    public override readonly payload: MediaSetMutedPayload,
  ) {
    super(target, payload);
  }
}
