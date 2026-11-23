import { MediaCrossOrigin } from "@matreshka/client-bff-protocol/enums/media-cross-origin";
import { MediaKind } from "@matreshka/client-bff-protocol/enums/media-kind";
import { MediaPreload } from "@matreshka/client-bff-protocol/enums/media-preload";
import { AnyBffToClientMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/bff-to-client-message";
import type { MediaElementConfig } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-create-message";
import { MediaCreateMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-create-message";
import { MediaDestroyMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-destroy-message";
import { MediaExitPictureInPictureMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-exit-picture-in-picture-message";
import { MediaLoadMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-load-message";
import { MediaPauseMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-pause-message";
import { MediaPlayMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-play-message";
import { MediaRequestPictureInPictureMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-request-picture-in-picture-message";
import { MediaSeekMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-seek-message";
import { MediaSetLoopMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-set-loop-message";
import { MediaSetMutedMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-set-muted-message";
import { MediaSetPlaybackRateMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-set-playback-rate-message";
import { MediaSetPreloadMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-set-preload-message";
import { MediaSetSrcMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-set-src-message";
import { MediaSetVolumeMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-set-volume-message";
import {
  MediaEndedEventMessage,
  MediaEnterPictureInPictureEventMessage,
  MediaErrorEventMessage,
  MediaLeavePictureInPictureEventMessage,
  MediaLoadedMetadataEventMessage,
  MediaPauseEventMessage,
  MediaPlayEventMessage,
  MediaPlayingEventMessage,
  MediaRateChangeEventMessage,
  MediaSeekedEventMessage,
  MediaSeekingEventMessage,
  MediaTimeUpdateEventMessage,
  MediaVolumeChangeEventMessage,
  MediaWaitingEventMessage,
} from "@matreshka/client-bff-protocol/messages/client-to-bff/platforms/media-event-messages";
import type { ServerComponentInteraction } from "@matreshka/client-bff-protocol/types/server-component-interaction";
import { filter, Observable, of, Subscription, take, tap } from "rxjs";
import { z } from "zod";
import {
  ServerAction,
  type ServerActionHandler,
} from "../components/actions/server-action";
import { Action } from "../core/actions/action";
import { LocalAction } from "../core/actions/local-action";
import type { Client } from "../core/client";
import { runWithClient } from "../core/client-context";
import type { ComponentInstance } from "../core/types/component-instance";
import type { Componentable } from "../core/types/componentable";
import { incomingMessageObserver } from "../core/utils/incoming-message-observer";
import { targetedClientPlatformAction } from "./utils/targeted-client-platform-action";

type MediaIncomingEvent =
  | MediaPlayEventMessage
  | MediaPauseEventMessage
  | MediaPlayingEventMessage
  | MediaWaitingEventMessage
  | MediaEndedEventMessage
  | MediaLoadedMetadataEventMessage
  | MediaSeekingEventMessage
  | MediaSeekedEventMessage
  | MediaTimeUpdateEventMessage
  | MediaVolumeChangeEventMessage
  | MediaRateChangeEventMessage
  | MediaErrorEventMessage
  | MediaEnterPictureInPictureEventMessage
  | MediaLeavePictureInPictureEventMessage;

function isMediaIncomingEvent(message: unknown): message is MediaIncomingEvent {
  return (
    message instanceof MediaPlayEventMessage ||
    message instanceof MediaPauseEventMessage ||
    message instanceof MediaPlayingEventMessage ||
    message instanceof MediaWaitingEventMessage ||
    message instanceof MediaEndedEventMessage ||
    message instanceof MediaLoadedMetadataEventMessage ||
    message instanceof MediaSeekingEventMessage ||
    message instanceof MediaSeekedEventMessage ||
    message instanceof MediaTimeUpdateEventMessage ||
    message instanceof MediaVolumeChangeEventMessage ||
    message instanceof MediaRateChangeEventMessage ||
    message instanceof MediaErrorEventMessage ||
    message instanceof MediaEnterPictureInPictureEventMessage ||
    message instanceof MediaLeavePictureInPictureEventMessage
  );
}

const mediaHandlersSchema = z.array(z.number().int().nonnegative());
const mediaProgressEventSchema = z.strictObject({
  currentTime: z.number(),
  duration: z.number(),
  handlers: mediaHandlersSchema,
});
const mediaVolumeEventSchema = z.strictObject({
  volume: z.number(),
  muted: z.boolean(),
  handlers: mediaHandlersSchema,
});
const mediaRateEventSchema = z.strictObject({
  playbackRate: z.number(),
  handlers: mediaHandlersSchema,
});
const mediaErrorEventSchema = z.strictObject({
  message: z.string(),
  handlers: mediaHandlersSchema,
});
const mediaPictureInPictureEventSchema = z.strictObject({
  handlers: mediaHandlersSchema,
});

function mediaEventSchema(message: MediaIncomingEvent) {
  if (message instanceof MediaVolumeChangeEventMessage) {
    return mediaVolumeEventSchema;
  }
  if (message instanceof MediaRateChangeEventMessage) {
    return mediaRateEventSchema;
  }
  if (message instanceof MediaErrorEventMessage) {
    return mediaErrorEventSchema;
  }
  if (
    message instanceof MediaEnterPictureInPictureEventMessage ||
    message instanceof MediaLeavePictureInPictureEventMessage
  ) {
    return mediaPictureInPictureEventSchema;
  }
  return mediaProgressEventSchema;
}

function mediaEventName(message: MediaIncomingEvent): string {
  if (message instanceof MediaPlayEventMessage) {
    return "play";
  }
  if (message instanceof MediaPauseEventMessage) {
    return "pause";
  }
  if (message instanceof MediaPlayingEventMessage) {
    return "playing";
  }
  if (message instanceof MediaWaitingEventMessage) {
    return "waiting";
  }
  if (message instanceof MediaEndedEventMessage) {
    return "ended";
  }
  if (message instanceof MediaLoadedMetadataEventMessage) {
    return "loadedmetadata";
  }
  if (message instanceof MediaSeekingEventMessage) {
    return "seeking";
  }
  if (message instanceof MediaSeekedEventMessage) {
    return "seeked";
  }
  if (message instanceof MediaTimeUpdateEventMessage) {
    return "timeupdate";
  }
  if (message instanceof MediaVolumeChangeEventMessage) {
    return "volumechange";
  }
  if (message instanceof MediaRateChangeEventMessage) {
    return "ratechange";
  }
  if (message instanceof MediaErrorEventMessage) {
    return "error";
  }
  if (message instanceof MediaEnterPictureInPictureEventMessage) {
    return "enterpictureinpicture";
  }
  return "leavepictureinpicture";
}

export { MediaCrossOrigin, MediaKind, MediaPreload };

export type MediaProgressPayload = {
  currentTime: number;
  duration: number;
};

export type MediaVolumePayload = {
  volume: number;
  muted: boolean;
};

export type MediaRatePayload = {
  playbackRate: number;
};

export type MediaErrorPayload = {
  message: string;
};

/** Одно действие или массив локальных и серверных, как `onClick` у компонента. */
export type MediaAction<Payload> =
  | ServerAction<Componentable, Payload>
  | ServerActionHandler<Componentable, Payload>
  | LocalAction;

export type MediaActionList<Payload> =
  | MediaAction<Payload>
  | MediaAction<Payload>[];

export type MediaEventConfig = {
  onPlay?: MediaActionList<MediaProgressPayload>;
  onPause?: MediaActionList<MediaProgressPayload>;
  onPlaying?: MediaActionList<MediaProgressPayload>;
  onWaiting?: MediaActionList<MediaProgressPayload>;
  onEnded?: MediaActionList<MediaProgressPayload>;
  onError?: MediaActionList<MediaErrorPayload>;
  onLoadedMetadata?: MediaActionList<MediaProgressPayload>;
  onSeeking?: MediaActionList<MediaProgressPayload>;
  onSeeked?: MediaActionList<MediaProgressPayload>;
  onVolumeChange?: MediaActionList<MediaVolumePayload>;
  onRateChange?: MediaActionList<MediaRatePayload>;
  onTimeUpdate?: MediaActionList<MediaProgressPayload>;
  onEnterPictureInPicture?: MediaActionList<Record<string, never>>;
  onLeavePictureInPicture?: MediaActionList<Record<string, never>>;
};

export type MediaConfig = MediaElementConfig & MediaEventConfig;

const EVENT_FIELDS: Record<keyof MediaEventConfig, string> = {
  onPlay: "play",
  onPause: "pause",
  onPlaying: "playing",
  onWaiting: "waiting",
  onEnded: "ended",
  onError: "error",
  onLoadedMetadata: "loadedmetadata",
  onSeeking: "seeking",
  onSeeked: "seeked",
  onVolumeChange: "volumechange",
  onRateChange: "ratechange",
  onTimeUpdate: "timeupdate",
  onEnterPictureInPicture: "enterpictureinpicture",
  onLeavePictureInPicture: "leavepictureinpicture",
};

type ParsedMediaAction = ServerAction<Componentable, unknown> | LocalAction;

/**
 * Сессия `HTMLMediaElement` на клиенте. Элемент не входит в дерево компонентов.
 * `id` — ключ клиентского реестра для будущего видеокомпонента.
 */
export abstract class Media {
  readonly id = "media-" + crypto.randomUUID();
  private readonly handlers = new Map<string, ParsedMediaAction[]>();
  private readonly rawConfig: MediaConfig;
  private sessionSubscription?: Subscription;
  private clientDestroySubscription?: Subscription;
  private ended = false;

  constructor(
    protected readonly client: Client,
    config: MediaConfig,
    private readonly kind: MediaKind,
  ) {
    this.rawConfig = config;
    this.bindEvents(config);
  }

  play(): Observable<void> {
    return this.send(
      (scope) => new MediaPlayMessage(scope, { mediaId: this.id }),
    );
  }

  pause(): Observable<void> {
    return this.send(
      (scope) => new MediaPauseMessage(scope, { mediaId: this.id }),
    );
  }

  load(): Observable<void> {
    return this.send(
      (scope) => new MediaLoadMessage(scope, { mediaId: this.id }),
    );
  }

  seek(time: number): Observable<void> {
    return this.send(
      (scope) => new MediaSeekMessage(scope, { mediaId: this.id, time }),
    );
  }

  setSrc(src: string): Observable<void> {
    return this.send(
      (scope) => new MediaSetSrcMessage(scope, { mediaId: this.id, src }),
    );
  }

  setVolume(volume: number): Observable<void> {
    return this.send(
      (scope) => new MediaSetVolumeMessage(scope, { mediaId: this.id, volume }),
    );
  }

  setMuted(muted: boolean): Observable<void> {
    return this.send(
      (scope) => new MediaSetMutedMessage(scope, { mediaId: this.id, muted }),
    );
  }

  setPlaybackRate(playbackRate: number): Observable<void> {
    return this.send(
      (scope) =>
        new MediaSetPlaybackRateMessage(scope, {
          mediaId: this.id,
          playbackRate,
        }),
    );
  }

  setLoop(loop: boolean): Observable<void> {
    return this.send(
      (scope) => new MediaSetLoopMessage(scope, { mediaId: this.id, loop }),
    );
  }

  setPreload(preload: MediaPreload): Observable<void> {
    return this.send(
      (scope) =>
        new MediaSetPreloadMessage(scope, { mediaId: this.id, preload }),
    );
  }

  destroy(): Observable<void> {
    if (this.ended) {
      return of(undefined);
    }
    return this.send(
      (scope) => new MediaDestroyMessage(scope, { mediaId: this.id }),
    ).pipe(tap(() => this.endSession()));
  }

  /** @internal */
  open(): Observable<void> {
    return targetedClientPlatformAction<void>(this.client, {
      outgoingMessage: (scope) =>
        runWithClient(
          this.client,
          () =>
            new MediaCreateMessage(scope, {
              mediaId: this.id,
              kind: this.kind,
              config: this.elementConfig(),
              interactions: this.serializeInteractions(),
            }),
        ),
    }).pipe(tap(() => this.startSession()));
  }

  protected send(
    outgoingMessage: (scope: string) => AnyBffToClientMessage,
  ): Observable<void> {
    return targetedClientPlatformAction<void>(this.client, {
      outgoingMessage,
    });
  }

  private elementConfig(): MediaElementConfig {
    const config = this.rawConfig;
    return {
      src: config.src,
      volume: config.volume,
      muted: config.muted,
      loop: config.loop,
      playbackRate: config.playbackRate,
      preload: config.preload,
      crossOrigin: config.crossOrigin,
      autoplay: config.autoplay,
    };
  }

  private bindEvents(config: MediaEventConfig): void {
    (Object.keys(EVENT_FIELDS) as (keyof MediaEventConfig)[]).forEach(
      (field) => {
        const actions = config[field];
        if (actions === undefined) {
          return;
        }
        const list = (Array.isArray(actions) ? actions : [actions]).map(
          (action) => this.parseAction(action as MediaAction<unknown>),
        );
        this.handlers.set(EVENT_FIELDS[field], list);
      },
    );
  }

  private parseAction(action: MediaAction<unknown>): ParsedMediaAction {
    if (action instanceof LocalAction || action instanceof ServerAction) {
      return action;
    }
    if (action instanceof Action) {
      throw new Error(
        "Media events accept LocalAction, ServerAction, or a server function",
      );
    }
    return new ServerAction(action);
  }

  private serializeInteractions(): Record<
    string,
    ServerComponentInteraction[]
  > {
    const interactions: Record<string, ServerComponentInteraction[]> = {};
    this.handlers.forEach((actions, event) => {
      interactions[event] = actions.map((action) => action.toJSON());
    });
    return interactions;
  }

  private startSession(): void {
    if (this.sessionSubscription || this.ended) {
      return;
    }
    this.sessionSubscription = this.client.incomingMessage$
      .pipe(
        filter(
          (message): message is MediaIncomingEvent =>
            isMediaIncomingEvent(message) && message.target === this.id,
        ),
      )
      .subscribe(
        incomingMessageObserver(this.client, (message) => {
          const parsed = mediaEventSchema(message).safeParse(message.payload);
          if (!parsed.success) {
            this.client.error$.next(
              `Invalid media event payload: ${message.type}`,
            );
            return;
          }
          const { handlers, ...payload } = parsed.data;
          this.emit(mediaEventName(message), payload, handlers);
        }),
      );
    this.clientDestroySubscription = this.client.destroy$
      .pipe(take(1))
      .subscribe(() => this.endSession());
  }

  private emit(event: string, payload: object, handlers: number[]): void {
    const actions = this.handlers.get(event);
    if (!actions) {
      return;
    }
    for (const index of handlers) {
      const action = actions[index];
      if (!(action instanceof ServerAction)) {
        continue;
      }
      action.execute({
        payload,
        instance: { client: this.client } as ComponentInstance,
      });
    }
  }

  private endSession(): void {
    if (this.ended) {
      return;
    }
    this.ended = true;
    this.sessionSubscription?.unsubscribe();
    this.clientDestroySubscription?.unsubscribe();
  }
}

export class Audio extends Media {
  constructor(client: Client, config: MediaConfig) {
    super(client, config, MediaKind.Audio);
  }
}

export class Video extends Media {
  constructor(client: Client, config: MediaConfig) {
    super(client, config, MediaKind.Video);
  }

  requestPictureInPicture(): Observable<void> {
    return this.send(
      (scope) =>
        new MediaRequestPictureInPictureMessage(scope, { mediaId: this.id }),
    );
  }

  exitPictureInPicture(): Observable<void> {
    return this.send(
      (scope) =>
        new MediaExitPictureInPictureMessage(scope, { mediaId: this.id }),
    );
  }
}
