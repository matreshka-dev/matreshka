import { MediaKind } from "../../../enums/media-kind";
import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";

export type PlatformMediaStreamTrackInfo = {
  kind: MediaKind;
  label?: string;
  settings?: Record<string, unknown>;
};

export type PlatformMediaStreamSuccessPayload = {
  streamId: string;
  tracks: PlatformMediaStreamTrackInfo[];
};

export class PlatformMediaStreamSuccessMessage extends PingableTargetedClientToBffMessage<PlatformMediaStreamSuccessPayload> {
  static readonly type = "platform-media-stream-success";
  constructor(
    public override readonly target: string,
    public override readonly payload: PlatformMediaStreamSuccessPayload,
  ) {
    super(target, payload);
  }
}
