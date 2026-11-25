import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";

export type RecordingEventHandlers = {
  handlers: number[];
};

export type RecordingProgressEventPayload = RecordingEventHandlers & {
  duration: number;
};

export type RecordingErrorEventPayload = RecordingEventHandlers & {
  message: string;
};

abstract class RecordingClientEventMessage<
  T extends RecordingEventHandlers,
> extends PingableTargetedClientToBffMessage<T> {
  constructor(
    public override readonly target: string,
    public override readonly payload: T,
  ) {
    super(target, payload);
  }
}

export class RecordingStartEventMessage extends RecordingClientEventMessage<RecordingProgressEventPayload> {
  static readonly type = "recording-start-event";
}

export class RecordingPauseEventMessage extends RecordingClientEventMessage<RecordingProgressEventPayload> {
  static readonly type = "recording-pause-event";
}

export class RecordingResumeEventMessage extends RecordingClientEventMessage<RecordingProgressEventPayload> {
  static readonly type = "recording-resume-event";
}

export class RecordingStopEventMessage extends RecordingClientEventMessage<RecordingProgressEventPayload> {
  static readonly type = "recording-stop-event";
}

export class RecordingTimeUpdateEventMessage extends RecordingClientEventMessage<RecordingProgressEventPayload> {
  static readonly type = "recording-time-update-event";
}

export class RecordingErrorEventMessage extends RecordingClientEventMessage<RecordingErrorEventPayload> {
  static readonly type = "recording-error-event";
}
