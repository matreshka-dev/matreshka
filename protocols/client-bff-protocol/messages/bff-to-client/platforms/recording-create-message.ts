import type { ServerComponentInteraction } from "../../../types/server-component-interaction";
import { PingableTargetedBffToClientMessage } from "../pingable-bff-to-client-message";

export type RecordingCreatePayload = {
  recordingId: string;
  streamIds: string[];
  mimeType?: string;
  /** Сериализованные действия по имени события (`start`, `pause`, `timeupdate`, …). */
  interactions: Record<string, ServerComponentInteraction[]>;
};

export class RecordingCreateMessage extends PingableTargetedBffToClientMessage<RecordingCreatePayload> {
  static readonly type = "recording-create";
  constructor(
    public override readonly target: string,
    public override readonly payload: RecordingCreatePayload,
  ) {
    super(target, payload);
  }
}
