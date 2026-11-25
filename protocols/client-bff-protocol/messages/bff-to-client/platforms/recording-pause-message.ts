import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
import type { RecordingIdPayload } from "./recording-id-payload";

export class RecordingPauseMessage extends PingableTargetedBffToClientMessage<RecordingIdPayload> {
  static readonly type = "recording-pause";
  constructor(
    public override readonly target: string,
    public override readonly payload: RecordingIdPayload,
  ) {
    super(target, payload);
  }
}
