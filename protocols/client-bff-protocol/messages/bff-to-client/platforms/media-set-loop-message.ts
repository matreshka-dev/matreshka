import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type MediaSetLoopPayload = {
  mediaId: string;
  loop: boolean;
};

export class MediaSetLoopMessage extends PingableTargetedBffToClientMessage<MediaSetLoopPayload> {
  static readonly type = "media-set-loop";
  constructor(
    public override readonly target: string,
    public override readonly payload: MediaSetLoopPayload,
  ) {
    super(target, payload);
  }
}
