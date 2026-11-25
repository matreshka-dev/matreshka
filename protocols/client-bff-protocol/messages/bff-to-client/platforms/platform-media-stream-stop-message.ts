import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type PlatformMediaStreamStopPayload = {
  streamId: string;
};

export class PlatformMediaStreamStopMessage extends PingableTargetedBffToClientMessage<PlatformMediaStreamStopPayload> {
  static readonly type = "platform-media-stream-stop";
  constructor(
    public override readonly target: string,
    public override readonly payload: PlatformMediaStreamStopPayload,
  ) {
    super(target, payload);
  }
}
