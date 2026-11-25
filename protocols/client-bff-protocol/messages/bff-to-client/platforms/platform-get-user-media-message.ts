import type { MediaStreamConstraints } from "../../../types/media-stream-constraints";
import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type PlatformGetUserMediaPayload = {
  streamId: string;
  constraints?: MediaStreamConstraints;
};

export class PlatformGetUserMediaMessage extends PingableTargetedBffToClientMessage<PlatformGetUserMediaPayload> {
  static readonly type = "platform-get-user-media";
  constructor(
    public override readonly target: string,
    public override readonly payload: PlatformGetUserMediaPayload,
  ) {
    super(target, payload);
  }
}
