import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type MediaSetSrcPayload = {
  mediaId: string;
  src: string;
};

export class MediaSetSrcMessage extends PingableTargetedBffToClientMessage<MediaSetSrcPayload> {
  static readonly type = "media-set-src";
  constructor(
    public override readonly target: string,
    public override readonly payload: MediaSetSrcPayload,
  ) {
    super(target, payload);
  }
}
