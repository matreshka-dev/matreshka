import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";
import type { RecordingIdPayload } from "./recording-id-payload";

export class RecordingStartMessage extends PingableTargetedBffToClientMessage<RecordingIdPayload> {
  static readonly type = "recording-start";
  constructor(
    public override readonly target: string,
    public override readonly payload: RecordingIdPayload,
  ) {
    super(target, payload);
  }
}
