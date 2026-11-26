import { MediaKind } from '@matreshka/client-bff-protocol/enums/media-kind';
import type { AnyBffToClientMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/bff-to-client-message';
import { RecordingCreateMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-create-message';
import { RecordingDestroyMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-destroy-message';
import { RecordingPauseMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-pause-message';
import { RecordingResumeMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-resume-message';
import { RecordingStartMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-start-message';
import { RecordingStopMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-stop-message';
import {
  RecordingErrorEventMessage,
  RecordingPauseEventMessage,
  RecordingResumeEventMessage,
  RecordingStartEventMessage,
  RecordingStopEventMessage,
  RecordingTimeUpdateEventMessage,
} from '@matreshka/client-bff-protocol/messages/client-to-bff/platforms/recording-event-messages';
import { RecordingStopSuccessMessage } from '@matreshka/client-bff-protocol/messages/client-to-bff/platforms/recording-stop-success-message';
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
import type { ClientLocalFileHost } from './local-file-host';
import type { ClientMediaStreamHost } from './media-stream-host';

const TIMEUPDATE_INTERVAL_MS = 250;

type RecordingSession = {
  streamIds: string[];
  mimeType?: string;
  interactions: Record<string, ServerComponentInteraction[]>;
  ready: Promise<void>;
  recorder?: MediaRecorder;
  chunks: Blob[];
  startedAt?: number;
  pausedAt?: number;
  pausedTotalMs: number;
  timeUpdateTimer?: ReturnType<typeof setInterval>;
  lastTimeUpdateSent: number;
};

/**
 * Реестр сессий `MediaRecorder` на клиенте.
 */
export class ClientRecordingHost {
  private readonly sessions = new Map<string, RecordingSession>();

  constructor(
    private readonly postman: PostmanService,
    private readonly streamHost: ClientMediaStreamHost,
    private readonly localFileHost: ClientLocalFileHost,
    private readonly contextHub: ContextHubService,
    private readonly componentHub: ComponentHubService,
    private readonly popupService: PopupService,
  ) {}

  handle(message: AnyBffToClientMessage): boolean {
    if (message instanceof RecordingCreateMessage) {
      void this.create(message);
      return true;
    }
    if (message instanceof RecordingStartMessage) {
      void this.start(message);
      return true;
    }
    if (message instanceof RecordingPauseMessage) {
      void this.run(message, (session) => {
        if (!session.recorder || session.recorder.state !== 'recording') {
          throw new Error('Recording is not active');
        }
        session.recorder.pause();
        session.pausedAt = Date.now();
        this.emitEvent(message.payload.recordingId, session, 'pause');
      });
      return true;
    }
    if (message instanceof RecordingResumeMessage) {
      void this.run(message, (session) => {
        if (!session.recorder || session.recorder.state !== 'paused') {
          throw new Error('Recording is not paused');
        }
        if (session.pausedAt !== undefined) {
          session.pausedTotalMs += Date.now() - session.pausedAt;
          session.pausedAt = undefined;
        }
        session.recorder.resume();
        this.emitEvent(message.payload.recordingId, session, 'resume');
      });
      return true;
    }
    if (message instanceof RecordingStopMessage) {
      void this.stop(message);
      return true;
    }
    if (message instanceof RecordingDestroyMessage) {
      void this.run(
        message,
        (session) => {
          this.teardownRecorder(session);
        },
        () => this.destroySession(message.payload.recordingId),
      );
      return true;
    }
    return false;
  }

  private async create(message: RecordingCreateMessage): Promise<void> {
    const { recordingId, streamIds, mimeType, interactions } = message.payload;
    try {
      if (this.sessions.has(recordingId)) {
        throw new Error(`Recording ${recordingId} already exists`);
      }
      if (streamIds.length === 0) {
        throw new Error('Recording requires at least one streamId');
      }
      for (const streamId of streamIds) {
        if (!this.streamHost.getStream(streamId)) {
          throw new Error(`MediaStream ${streamId} not found`);
        }
      }
      this.sessions.set(recordingId, {
        streamIds,
        mimeType,
        interactions,
        ready: this.whenContextsReady(interactions),
        chunks: [],
        pausedTotalMs: 0,
        lastTimeUpdateSent: 0,
      });
      completeTargetedAction(this.postman, message.target);
    } catch (error) {
      this.destroySession(recordingId);
      failTargetedAction(this.postman, message.target, error);
    }
  }

  private async start(message: RecordingStartMessage): Promise<void> {
    const session = this.sessions.get(message.payload.recordingId);
    try {
      if (!session) {
        throw new Error(`Recording ${message.payload.recordingId} not found`);
      }
      if (session.recorder && session.recorder.state !== 'inactive') {
        throw new Error('Recording is already active');
      }
      this.teardownRecorder(session);
      const tracks = session.streamIds.flatMap((streamId) => {
        const stream = this.streamHost.getStream(streamId);
        if (!stream) {
          throw new Error(`MediaStream ${streamId} not found`);
        }
        return stream.getTracks();
      });
      if (tracks.length === 0) {
        throw new Error('No media tracks to record');
      }
      const combined = new MediaStream(tracks);
      const options =
        session.mimeType && MediaRecorder.isTypeSupported(session.mimeType)
          ? { mimeType: session.mimeType }
          : undefined;
      const recorder = new MediaRecorder(combined, options);
      session.chunks = [];
      session.pausedTotalMs = 0;
      session.pausedAt = undefined;
      session.startedAt = Date.now();
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          session.chunks.push(event.data);
        }
      };
      recorder.onerror = () => {
        this.emitEvent(message.payload.recordingId, session, 'error', {
          message: 'MediaRecorder error',
        });
      };
      session.recorder = recorder;
      recorder.start(1000);
      this.startTimeUpdates(message.payload.recordingId, session);
      this.emitEvent(message.payload.recordingId, session, 'start');
      completeTargetedAction(this.postman, message.target);
    } catch (error) {
      failTargetedAction(this.postman, message.target, error);
    }
  }

  private async stop(message: RecordingStopMessage): Promise<void> {
    const recordingId = message.payload.recordingId;
    const session = this.sessions.get(recordingId);
    try {
      if (!session) {
        throw new Error(`Recording ${recordingId} not found`);
      }
      if (!session.recorder || session.recorder.state === 'inactive') {
        throw new Error('Recording is not active');
      }
      const recorder = session.recorder;
      const blob = await new Promise<Blob>((resolve, reject) => {
        const onStop = () => {
          recorder.removeEventListener('error', onError);
          const type =
            recorder.mimeType ||
            session.mimeType ||
            (this.hasVideoTrack(session) ? 'video/webm' : 'audio/webm');
          resolve(new Blob(session.chunks, { type }));
        };
        const onError = () => {
          recorder.removeEventListener('stop', onStop);
          reject(new Error('MediaRecorder error on stop'));
        };
        recorder.addEventListener('stop', onStop, { once: true });
        recorder.addEventListener('error', onError, { once: true });
        recorder.stop();
      });
      this.stopTimeUpdates(session);
      if (session.pausedAt !== undefined) {
        session.pausedTotalMs += Date.now() - session.pausedAt;
        session.pausedAt = undefined;
      }
      const duration = elapsedSeconds(session);
      this.emitEvent(recordingId, session, 'stop');
      session.recorder = undefined;
      session.chunks = [];
      const kind = this.hasVideoTrack(session)
        ? MediaKind.Video
        : MediaKind.Audio;
      const extension = blob.type.includes('mp4')
        ? 'mp4'
        : blob.type.includes('ogg')
          ? 'ogg'
          : 'webm';
      const name = `recording-${Date.now()}.${extension}`;
      const id = crypto.randomUUID();
      const url = URL.createObjectURL(blob);
      const type =
        blob.type || (kind === MediaKind.Video ? 'video/webm' : 'audio/webm');
      this.localFileHost.register(id, blob, url, name);
      this.postman.outcomingMessage$.next(
        new RecordingStopSuccessMessage(message.target, {
          id,
          url,
          type,
          size: blob.size,
          name,
          lastModified: Date.now(),
          duration,
          kind,
        }),
      );
    } catch (error) {
      failTargetedAction(this.postman, message.target, error);
    }
  }

  private async run(
    message: { target: string; payload: { recordingId: string } },
    action: (session: RecordingSession) => void | Promise<void>,
    afterSuccess?: () => void,
  ): Promise<void> {
    const session = this.sessions.get(message.payload.recordingId);
    try {
      if (!session) {
        throw new Error(`Recording ${message.payload.recordingId} not found`);
      }
      await action(session);
      afterSuccess?.();
      completeTargetedAction(this.postman, message.target);
    } catch (error) {
      failTargetedAction(this.postman, message.target, error);
    }
  }

  private startTimeUpdates(
    recordingId: string,
    session: RecordingSession,
  ): void {
    this.stopTimeUpdates(session);
    if (!session.interactions['timeupdate']?.length) {
      return;
    }
    session.timeUpdateTimer = setInterval(() => {
      const now = Date.now();
      if (now - session.lastTimeUpdateSent < TIMEUPDATE_INTERVAL_MS) {
        return;
      }
      session.lastTimeUpdateSent = now;
      this.emitEvent(recordingId, session, 'timeupdate');
    }, TIMEUPDATE_INTERVAL_MS);
  }

  private stopTimeUpdates(session: RecordingSession): void {
    if (session.timeUpdateTimer !== undefined) {
      clearInterval(session.timeUpdateTimer);
      session.timeUpdateTimer = undefined;
    }
  }

  private teardownRecorder(session: RecordingSession): void {
    this.stopTimeUpdates(session);
    if (session.recorder && session.recorder.state !== 'inactive') {
      try {
        session.recorder.stop();
      } catch {
        // ignore
      }
    }
    session.recorder = undefined;
    session.chunks = [];
    session.startedAt = undefined;
    session.pausedAt = undefined;
    session.pausedTotalMs = 0;
  }

  private destroySession(recordingId: string): void {
    const session = this.sessions.get(recordingId);
    if (!session) {
      return;
    }
    this.teardownRecorder(session);
    this.sessions.delete(recordingId);
  }

  private emitEvent(
    recordingId: string,
    session: RecordingSession,
    event: string,
    errorPayload?: { message: string },
  ): void {
    void session.ready.then(() => {
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

      const duration = elapsedSeconds(session);
      const outgoing =
        event === 'error'
          ? new RecordingErrorEventMessage(recordingId, {
              message: errorPayload?.message ?? 'Recording error',
              handlers,
            })
          : event === 'start'
            ? new RecordingStartEventMessage(recordingId, {
                duration,
                handlers,
              })
            : event === 'pause'
              ? new RecordingPauseEventMessage(recordingId, {
                  duration,
                  handlers,
                })
              : event === 'resume'
                ? new RecordingResumeEventMessage(recordingId, {
                    duration,
                    handlers,
                  })
                : event === 'stop'
                  ? new RecordingStopEventMessage(recordingId, {
                      duration,
                      handlers,
                    })
                  : event === 'timeupdate'
                    ? new RecordingTimeUpdateEventMessage(recordingId, {
                        duration,
                        handlers,
                      })
                    : undefined;
      if (outgoing) {
        this.postman.outcomingMessage$.next(outgoing);
      }
    });
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

  private hasVideoTrack(session: RecordingSession): boolean {
    for (const streamId of session.streamIds) {
      const stream = this.streamHost.getStream(streamId);
      if (stream?.getVideoTracks().length) {
        return true;
      }
    }
    return false;
  }
}

function elapsedSeconds(session: RecordingSession): number {
  if (session.startedAt === undefined) {
    return 0;
  }
  let paused = session.pausedTotalMs;
  if (session.pausedAt !== undefined) {
    paused += Date.now() - session.pausedAt;
  }
  return Math.max(0, (Date.now() - session.startedAt - paused) / 1000);
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
