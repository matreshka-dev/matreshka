import type { DisplayMediaStreamOptions } from "../../../types/media-stream-constraints";
import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type PlatformGetDisplayMediaPayload = {
  streamId: string;
  options?: DisplayMediaStreamOptions;
};

export class PlatformGetDisplayMediaMessage extends PingableTargetedBffToClientMessage<PlatformGetDisplayMediaPayload> {
  static readonly type = "platform-get-display-media";
  constructor(
    public override readonly target: string,
    public override readonly payload: PlatformGetDisplayMediaPayload,
  ) {
    super(target, payload);
  }
}
