import { PingableTargetedClientToBffMessage } from "../pingable-client-to-bff-message";

export type MediaEventHandlers = {
  handlers: number[];
};

export type MediaProgressEventPayload = MediaEventHandlers & {
  currentTime: number;
  duration: number;
};

export type MediaVolumeEventPayload = MediaEventHandlers & {
  volume: number;
  muted: boolean;
};

export type MediaRateEventPayload = MediaEventHandlers & {
  playbackRate: number;
};

export type MediaErrorEventPayload = MediaEventHandlers & {
  message: string;
};

abstract class MediaClientEventMessage<
  T extends MediaEventHandlers,
> extends PingableTargetedClientToBffMessage<T> {
  constructor(
    public override readonly target: string,
    public override readonly payload: T,
  ) {
    super(target, payload);
  }
}

export class MediaPlayEventMessage extends MediaClientEventMessage<MediaProgressEventPayload> {
  static readonly type = "media-play-event";
}
export class MediaPauseEventMessage extends MediaClientEventMessage<MediaProgressEventPayload> {
  static readonly type = "media-pause-event";
}
export class MediaPlayingEventMessage extends MediaClientEventMessage<MediaProgressEventPayload> {
  static readonly type = "media-playing-event";
}
export class MediaWaitingEventMessage extends MediaClientEventMessage<MediaProgressEventPayload> {
  static readonly type = "media-waiting-event";
}
export class MediaEndedEventMessage extends MediaClientEventMessage<MediaProgressEventPayload> {
  static readonly type = "media-ended-event";
}
export class MediaLoadedMetadataEventMessage extends MediaClientEventMessage<MediaProgressEventPayload> {
  static readonly type = "media-loaded-metadata-event";
}
export class MediaSeekingEventMessage extends MediaClientEventMessage<MediaProgressEventPayload> {
  static readonly type = "media-seeking-event";
}
export class MediaSeekedEventMessage extends MediaClientEventMessage<MediaProgressEventPayload> {
  static readonly type = "media-seeked-event";
}
export class MediaTimeUpdateEventMessage extends MediaClientEventMessage<MediaProgressEventPayload> {
  static readonly type = "media-time-update-event";
}
export class MediaVolumeChangeEventMessage extends MediaClientEventMessage<MediaVolumeEventPayload> {
  static readonly type = "media-volume-change-event";
}
export class MediaRateChangeEventMessage extends MediaClientEventMessage<MediaRateEventPayload> {
  static readonly type = "media-rate-change-event";
}
export class MediaErrorEventMessage extends MediaClientEventMessage<MediaErrorEventPayload> {
  static readonly type = "media-error-event";
}
export class MediaEnterPictureInPictureEventMessage extends MediaClientEventMessage<MediaEventHandlers> {
  static readonly type = "media-enter-picture-in-picture-event";
}
export class MediaLeavePictureInPictureEventMessage extends MediaClientEventMessage<MediaEventHandlers> {
  static readonly type = "media-leave-picture-in-picture-event";
}
