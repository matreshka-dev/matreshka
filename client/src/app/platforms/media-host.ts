import { MediaKind } from '@matreshka/client-bff-protocol/enums/media-kind';
import type { AnyBffToClientMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/bff-to-client-message';
import type { MediaElementConfig } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-create-message';
import { MediaCreateMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-create-message';
import { MediaDestroyMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-destroy-message';
import { MediaExitPictureInPictureMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-exit-picture-in-picture-message';
import { MediaLoadMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-load-message';
import { MediaPauseMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-pause-message';
import { MediaPlayMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-play-message';
import { MediaRequestPictureInPictureMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-request-picture-in-picture-message';
import { MediaSeekMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-seek-message';
import { MediaSetLoopMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-set-loop-message';
import { MediaSetMutedMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-set-muted-message';
import { MediaSetPlaybackRateMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-set-playback-rate-message';
import { MediaSetPreloadMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-set-preload-message';
import { MediaSetSrcMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-set-src-message';
import { MediaSetVolumeMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/media-set-volume-message';
import {
  MediaEndedEventMessage,
  MediaEnterPictureInPictureEventMessage,
  MediaErrorEventMessage,
  MediaLeavePictureInPictureEventMessage,
  MediaLoadedMetadataEventMessage,
  MediaPauseEventMessage as MediaPauseEvent,
  MediaPlayEventMessage,
  MediaPlayingEventMessage,
  MediaRateChangeEventMessage,
  MediaSeekedEventMessage,
  MediaSeekingEventMessage,
  MediaTimeUpdateEventMessage,
  MediaVolumeChangeEventMessage,
  MediaWaitingEventMessage,
} from '@matreshka/client-bff-protocol/messages/client-to-bff/platforms/media-event-messages';
import type { Condition } from '@matreshka/client-bff-protocol/types/condition';
import type { ServerComponentInteraction } from '@matreshka/client-bff-protocol/types/server-component-interaction';
import { parseContextPath } from '@matreshka/shared/utils/parse-context-path';
import { firstValueFrom, take } from 'rxjs';
import { executeLocalInteraction } from '../components/server/utils/execute-local-interaction';
import {
  runComponentAnimations,
  type ComponentAnimationPayload,
} from '../components/server/utils/run-component-animations';
import { ComponentHubService } from '../services/component-hub.service';
import { ContextHubService } from '../services/context-hub.service';
import { PopupService } from '../services/popup.service';
import { PostmanService } from '../services/postman.service';
import {
  completeTargetedAction,
  failTargetedAction,
} from '../utils/targeted-action';

const TIMEUPDATE_INTERVAL_MS = 250;

type MediaSession = {
  element: HTMLMediaElement;
  kind: MediaKind;
  interactions: Record<string, ServerComponentInteraction[]>;
  ready: Promise<void>;
  abort: AbortController;
  lastTimeUpdateSent: number;
};

/**
 * Реестр `HTMLMediaElement`, которые не вставлены в документ.
 * Видеокомпонент позже сможет забрать элемент по `mediaId`.
 */
export class ClientMediaHost {
  private readonly sessions = new Map<string, MediaSession>();

  constructor(
    private readonly postman: PostmanService,
    private readonly contextHub: ContextHubService,
    private readonly componentHub: ComponentHubService,
    private readonly popupService: PopupService,
  ) {}

  handle(message: AnyBffToClientMessage): boolean {
    if (message instanceof MediaCreateMessage) {
      void this.create(message);
      return true;
    }
    if (message instanceof MediaPlayMessage) {
      void this.run(message, (session) => session.element.play());
      return true;
    }
    if (message instanceof MediaPauseMessage) {
      void this.run(message, (session) => session.element.pause());
      return true;
    }
    if (message instanceof MediaLoadMessage) {
      void this.run(message, (session) => session.element.load());
      return true;
    }
    if (message instanceof MediaSeekMessage) {
      void this.run(message, (session) => {
        session.element.currentTime = message.payload.time;
      });
      return true;
    }
    if (message instanceof MediaSetSrcMessage) {
      void this.run(message, (session) => {
        session.element.src = message.payload.src;
      });
      return true;
    }
    if (message instanceof MediaSetVolumeMessage) {
      void this.run(message, (session) => {
        session.element.volume = message.payload.volume;
      });
      return true;
    }
    if (message instanceof MediaSetMutedMessage) {
      void this.run(message, (session) => {
        session.element.muted = message.payload.muted;
      });
      return true;
    }
    if (message instanceof MediaSetPlaybackRateMessage) {
      void this.run(message, (session) => {
        session.element.playbackRate = message.payload.playbackRate;
      });
      return true;
    }
    if (message instanceof MediaSetLoopMessage) {
      void this.run(message, (session) => {
        session.element.loop = message.payload.loop;
      });
      return true;
    }
    if (message instanceof MediaSetPreloadMessage) {
      void this.run(message, (session) => {
        session.element.preload = message.payload.preload;
      });
      return true;
    }
    if (message instanceof MediaRequestPictureInPictureMessage) {
      void this.run(message, (session) =>
        this.requestPictureInPicture(session),
      );
      return true;
    }
    if (message instanceof MediaExitPictureInPictureMessage) {
      void this.run(message, (session) => this.exitPictureInPicture(session));
      return true;
    }
    if (message instanceof MediaDestroyMessage) {
      void this.run(
        message,
        (session) => session.element.pause(),
        () => this.destroySession(message.payload.mediaId),
      );
      return true;
    }
    return false;
  }

  private async create(message: MediaCreateMessage): Promise<void> {
    const { mediaId, kind, config, interactions } = message.payload;
    try {
      if (this.sessions.has(mediaId)) {
        throw new Error(`Media ${mediaId} already exists`);
      }
      const element = this.createElement(kind);
      this.applyConfig(element, config);
      const session: MediaSession = {
        element,
        kind,
        interactions,
        ready: this.whenContextsReady(interactions),
        abort: new AbortController(),
        lastTimeUpdateSent: 0,
      };
      this.sessions.set(mediaId, session);
      this.listen(mediaId, session);
      if (config.autoplay) {
        await element.play();
      }
      completeTargetedAction(this.postman, message.target);
    } catch (error) {
      this.destroySession(mediaId);
      failTargetedAction(this.postman, message.target, error);
    }
  }

  private createElement(kind: MediaKind): HTMLMediaElement {
    if (kind === MediaKind.Audio) {
      return new Audio();
    }
    return document.createElement('video');
  }

  private applyConfig(
    element: HTMLMediaElement,
    config: MediaElementConfig,
  ): void {
    if (config.src !== undefined) {
      element.src = config.src;
    }
    if (config.volume !== undefined) {
      element.volume = config.volume;
    }
    if (config.muted !== undefined) {
      element.muted = config.muted;
    }
    if (config.loop !== undefined) {
      element.loop = config.loop;
    }
    if (config.playbackRate !== undefined) {
      element.playbackRate = config.playbackRate;
    }
    if (config.preload !== undefined) {
      element.preload = config.preload;
    }
    if (config.crossOrigin !== undefined) {
      element.crossOrigin = config.crossOrigin;
    }
  }

  private listen(mediaId: string, session: MediaSession): void {
    for (const event of Object.keys(session.interactions)) {
      session.element.addEventListener(
        event,
        () => {
          void session.ready.then(() => this.onDomEvent(mediaId, event));
        },
        { signal: session.abort.signal },
      );
    }
  }

  private onDomEvent(mediaId: string, event: string): void {
    const session = this.sessions.get(mediaId);
    if (!session) {
      return;
    }
    const interactions = session.interactions[event] ?? [];
    const handlers: number[] = [];
    const animateByTarget = new Map<string, ComponentAnimationPayload[]>();

    interactions.forEach((interaction, index) => {
      if (!this.conditionsMet(interaction)) {
        return;
      }
      if (interaction.class === 'server-interaction') {
        handlers.push(index);
        return;
      }
      executeLocalInteraction(
        interaction,
        {
          contextHub: this.contextHub,
          componentHub: this.componentHub,
          popupService: this.popupService,
        },
        animateByTarget,
      );
    });

    if (animateByTarget.size > 0) {
      for (const [targetId, payloads] of animateByTarget) {
        for (const target of this.componentHub.getInstancesByComponentId(
          targetId,
        )) {
          void runComponentAnimations(target.renderRoot(), payloads);
        }
      }
    }

    if (handlers.length === 0) {
      return;
    }
    if (event === 'timeupdate') {
      const now = Date.now();
      if (now - session.lastTimeUpdateSent < TIMEUPDATE_INTERVAL_MS) {
        return;
      }
      session.lastTimeUpdateSent = now;
    }
    const outgoing = mediaEventMessage(
      mediaId,
      event,
      session.element,
      handlers,
    );
    if (!outgoing) {
      return;
    }
    this.postman.outcomingMessage$.next(outgoing);
  }

  private async run(
    message: { target: string; payload: { mediaId: string } },
    action: (session: MediaSession) => void | Promise<void>,
    afterSuccess?: () => void,
  ): Promise<void> {
    const session = this.sessions.get(message.payload.mediaId);
    try {
      if (!session) {
        throw new Error(`Media ${message.payload.mediaId} not found`);
      }
      await action(session);
      afterSuccess?.();
      completeTargetedAction(this.postman, message.target);
    } catch (error) {
      failTargetedAction(this.postman, message.target, error);
    }
  }

  private async requestPictureInPicture(session: MediaSession): Promise<void> {
    if (!(session.element instanceof HTMLVideoElement)) {
      throw new Error('Picture in picture доступен только для видео');
    }
    await session.element.requestPictureInPicture();
  }

  private async exitPictureInPicture(session: MediaSession): Promise<void> {
    if (!(session.element instanceof HTMLVideoElement)) {
      throw new Error('Picture in picture доступен только для видео');
    }
    if (document.pictureInPictureElement === session.element) {
      await document.exitPictureInPicture();
    }
  }

  private destroySession(mediaId: string): void {
    const session = this.sessions.get(mediaId);
    if (!session) {
      return;
    }
    session.abort.abort();
    session.element.pause();
    session.element.removeAttribute('src');
    session.element.load();
    this.sessions.delete(mediaId);
  }

  private whenContextsReady(
    interactions: Record<string, ServerComponentInteraction[]>,
  ): Promise<void> {
    const ids = contextIds(interactions);
    if (ids.size === 0) {
      return Promise.resolve();
    }
    return Promise.all(
      [...ids].map((id) =>
        firstValueFrom(this.contextHub.init$(id).pipe(take(1))),
      ),
    ).then(() => undefined);
  }

  private conditionsMet(interaction: ServerComponentInteraction): boolean {
    if (!interaction.conditions || interaction.conditions.length === 0) {
      return true;
    }
    return this.componentHub.conditionsMet(interaction.conditions);
  }
}

function mediaEventMessage(
  mediaId: string,
  event: string,
  element: HTMLMediaElement,
  handlers: number[],
) {
  const progress = {
    currentTime: element.currentTime,
    duration: Number.isFinite(element.duration) ? element.duration : 0,
    handlers,
  };
  switch (event) {
    case 'play':
      return new MediaPlayEventMessage(mediaId, progress);
    case 'pause':
      return new MediaPauseEvent(mediaId, progress);
    case 'playing':
      return new MediaPlayingEventMessage(mediaId, progress);
    case 'waiting':
      return new MediaWaitingEventMessage(mediaId, progress);
    case 'ended':
      return new MediaEndedEventMessage(mediaId, progress);
    case 'loadedmetadata':
      return new MediaLoadedMetadataEventMessage(mediaId, progress);
    case 'seeking':
      return new MediaSeekingEventMessage(mediaId, progress);
    case 'seeked':
      return new MediaSeekedEventMessage(mediaId, progress);
    case 'timeupdate':
      return new MediaTimeUpdateEventMessage(mediaId, progress);
    case 'volumechange':
      return new MediaVolumeChangeEventMessage(mediaId, {
        volume: element.volume,
        muted: element.muted,
        handlers,
      });
    case 'ratechange':
      return new MediaRateChangeEventMessage(mediaId, {
        playbackRate: element.playbackRate,
        handlers,
      });
    case 'error':
      return new MediaErrorEventMessage(mediaId, {
        message: element.error?.message ?? 'media error',
        handlers,
      });
    case 'enterpictureinpicture':
      return new MediaEnterPictureInPictureEventMessage(mediaId, { handlers });
    case 'leavepictureinpicture':
      return new MediaLeavePictureInPictureEventMessage(mediaId, { handlers });
    default:
      return undefined;
  }
}

function contextIds(
  interactions: Record<string, ServerComponentInteraction[]>,
): Set<string> {
  const ids = new Set<string>();
  for (const list of Object.values(interactions)) {
    for (const interaction of list) {
      collectPayloadContextIds(interaction.payload, ids);
      for (const condition of interaction.conditions ?? []) {
        collectConditionContextIds(condition, ids);
      }
    }
  }
  return ids;
}

function collectPayloadContextIds(payload: object, ids: Set<string>): void {
  const record = payload as { context?: unknown; ref?: unknown };
  if (typeof record.context === 'string') {
    ids.add(record.context);
  }
  if (typeof record.ref === 'string') {
    ids.add(parseContextPath(record.ref).contextId);
  }
}

function collectConditionContextIds(
  condition: Condition,
  ids: Set<string>,
): void {
  if (!('payload' in condition) || condition.payload === undefined) {
    return;
  }
  const payload = condition.payload as {
    ref?: unknown;
    conditions?: Condition[];
  };
  if (typeof payload.ref === 'string') {
    ids.add(parseContextPath(payload.ref).contextId);
  }
  if (Array.isArray(payload.conditions)) {
    for (const child of payload.conditions) {
      collectConditionContextIds(child, ids);
    }
  }
}
