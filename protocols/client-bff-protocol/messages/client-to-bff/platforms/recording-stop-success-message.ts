import { MediaKind } from "../../../enums/media-kind";
import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";

/** Результат записи: как FileInfo + duration/kind для плеера. */
export type RecordingResultPayload = {
  id: string;
  url: string;
  type: string;
  size: number;
  name: string;
  lastModified: number;
  duration: number;
  kind: MediaKind;
};

export class RecordingStopSuccessMessage extends PingableTargetedClientToBffMessage<RecordingResultPayload> {
  static readonly type = "recording-stop-success";
  constructor(
    public override readonly target: string,
    public override readonly payload: RecordingResultPayload,
  ) {
    super(target, payload);
  }
}
