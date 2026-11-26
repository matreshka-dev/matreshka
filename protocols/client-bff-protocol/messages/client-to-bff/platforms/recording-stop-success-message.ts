import { MediaKind } from "../../../enums/media-kind";
import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";

/** Результат записи: метаданные LocalFile + duration/kind. */
export type RecordingStopSuccessPayload = {
  id: string;
  url: string;
  type: string;
  size: number;
  name: string;
  lastModified: number;
  duration: number;
  kind: MediaKind;
};

export class RecordingStopSuccessMessage extends PingableTargetedClientToBffMessage<RecordingStopSuccessPayload> {
  static readonly type = "recording-stop-success";
  constructor(
    public override readonly target: string,
    public override readonly payload: RecordingStopSuccessPayload,
  ) {
    super(target, payload);
  }
}
