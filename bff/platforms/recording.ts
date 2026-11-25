import { MediaKind } from "@matreshka/client-bff-protocol/enums/media-kind";
import { AnyBffToClientMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/bff-to-client-message";
import { RecordingCreateMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-create-message";
import { RecordingDestroyMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-destroy-message";
import { RecordingPauseMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-pause-message";
import { RecordingResumeMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-resume-message";
import { RecordingStartMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-start-message";
import { RecordingStopMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/recording-stop-message";
import {
  RecordingErrorEventMessage,
  RecordingPauseEventMessage,
  RecordingResumeEventMessage,
  RecordingStartEventMessage,
  RecordingStopEventMessage,
  RecordingTimeUpdateEventMessage,
} from "@matreshka/client-bff-protocol/messages/client-to-bff/platforms/recording-event-messages";
import { RecordingStopSuccessMessage } from "@matreshka/client-bff-protocol/messages/client-to-bff/platforms/recording-stop-success-message";
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
import type { MediaStreamRef } from "./media-stream-ref";
import { targetedClientPlatformAction } from "./utils/targeted-client-platform-action";

export { MediaKind };

export type RecordingResult = {
  id: string;
  url: string;
  type: string;
  size: number;
  name: string;
  lastModified: number;
  duration: number;
  kind: MediaKind;
};

export type RecordingProgressPayload = {
  duration: number;
};

export type RecordingErrorPayload = {
  message: string;
};

/** Одно действие или массив локальных и серверных, как у Media. */
export type RecordingAction<Payload> =
  | ServerAction<Componentable, Payload>
  | ServerActionHandler<Componentable, Payload>
  | LocalAction;

export type RecordingActionList<Payload> =
  | RecordingAction<Payload>
  | RecordingAction<Payload>[];

export type RecordingEventConfig = {
  onStart?: RecordingActionList<RecordingProgressPayload>;
  onPause?: RecordingActionList<RecordingProgressPayload>;
  onResume?: RecordingActionList<RecordingProgressPayload>;
  onStop?: RecordingActionList<RecordingProgressPayload>;
  onError?: RecordingActionList<RecordingErrorPayload>;
  onTimeUpdate?: RecordingActionList<RecordingProgressPayload>;
};

export type RecordingConfig = RecordingEventConfig & {
  streams: MediaStreamRef | MediaStreamRef[];
  mimeType?: string;
};

type RecordingIncomingEvent =
  | RecordingStartEventMessage
  | RecordingPauseEventMessage
  | RecordingResumeEventMessage
  | RecordingStopEventMessage
  | RecordingTimeUpdateEventMessage
  | RecordingErrorEventMessage;

function isRecordingIncomingEvent(
  message: unknown,
): message is RecordingIncomingEvent {
  return (
    message instanceof RecordingStartEventMessage ||
    message instanceof RecordingPauseEventMessage ||
    message instanceof RecordingResumeEventMessage ||
    message instanceof RecordingStopEventMessage ||
    message instanceof RecordingTimeUpdateEventMessage ||
    message instanceof RecordingErrorEventMessage
  );
}

const recordingHandlersSchema = z.array(z.number().int().nonnegative());
const recordingProgressEventSchema = z.strictObject({
  duration: z.number(),
  handlers: recordingHandlersSchema,
});
const recordingErrorEventSchema = z.strictObject({
  message: z.string(),
  handlers: recordingHandlersSchema,
});

const recordingResultSchema = z.strictObject({
  id: z.string(),
  url: z.string().refine((val) => val.startsWith("blob:"), {
    message: "url must be a blob",
  }),
  type: z.string(),
  size: z.number(),
  name: z.string(),
  lastModified: z.number(),
  duration: z.number(),
  kind: z.nativeEnum(MediaKind),
});

function recordingEventSchema(message: RecordingIncomingEvent) {
  if (message instanceof RecordingErrorEventMessage) {
    return recordingErrorEventSchema;
  }
  return recordingProgressEventSchema;
}

function recordingEventName(message: RecordingIncomingEvent): string {
  if (message instanceof RecordingStartEventMessage) {
    return "start";
  }
  if (message instanceof RecordingPauseEventMessage) {
    return "pause";
  }
  if (message instanceof RecordingResumeEventMessage) {
    return "resume";
  }
  if (message instanceof RecordingStopEventMessage) {
    return "stop";
  }
  if (message instanceof RecordingTimeUpdateEventMessage) {
    return "timeupdate";
  }
  return "error";
}

type ParsedRecordingAction = ServerAction<Componentable, unknown> | LocalAction;

const EVENT_FIELDS: Record<keyof RecordingEventConfig, string> = {
  onStart: "start",
  onPause: "pause",
  onResume: "resume",
  onStop: "stop",
  onError: "error",
  onTimeUpdate: "timeupdate",
};

/**
 * Сессия `MediaRecorder` на клиенте поверх одного или нескольких `MediaStreamRef`.
 */
export class Recording {
  readonly id = "recording-" + crypto.randomUUID();
  private readonly handlers = new Map<string, ParsedRecordingAction[]>();
  private readonly streamIds: string[];
  private readonly mimeType?: string;
  private sessionSubscription?: Subscription;
  private clientDestroySubscription?: Subscription;
  private ended = false;

  constructor(
    private readonly client: Client,
    config: RecordingConfig,
  ) {
    const streams = Array.isArray(config.streams)
      ? config.streams
      : [config.streams];
    if (streams.length === 0) {
      throw new Error("Recording requires at least one MediaStreamRef");
    }
    this.streamIds = streams.map((stream) => stream.id);
    this.mimeType = config.mimeType;
    this.bindEvents(config);
  }

  start(): Observable<void> {
    return this.send(
      (scope) => new RecordingStartMessage(scope, { recordingId: this.id }),
    );
  }

  pause(): Observable<void> {
    return this.send(
      (scope) => new RecordingPauseMessage(scope, { recordingId: this.id }),
    );
  }

  resume(): Observable<void> {
    return this.send(
      (scope) => new RecordingResumeMessage(scope, { recordingId: this.id }),
    );
  }

  stop(): Observable<RecordingResult> {
    return targetedClientPlatformAction<RecordingResult>(this.client, {
      outgoingMessage: (scope) =>
        new RecordingStopMessage(scope, { recordingId: this.id }),
      parseSuccess: (unsafeMessage) => {
        if (!(unsafeMessage instanceof RecordingStopSuccessMessage)) {
          return;
        }
        return recordingResultSchema.parse(unsafeMessage.payload);
      },
    });
  }

  destroy(): Observable<void> {
    if (this.ended) {
      return of(undefined);
    }
    return this.send(
      (scope) => new RecordingDestroyMessage(scope, { recordingId: this.id }),
    ).pipe(tap(() => this.endSession()));
  }

  /** @internal */
  open(): Observable<void> {
    return targetedClientPlatformAction<void>(this.client, {
      outgoingMessage: (scope) =>
        runWithClient(
          this.client,
          () =>
            new RecordingCreateMessage(scope, {
              recordingId: this.id,
              streamIds: this.streamIds,
              mimeType: this.mimeType,
              interactions: this.serializeInteractions(),
            }),
        ),
    }).pipe(tap(() => this.startSession()));
  }

  private send(
    outgoingMessage: (scope: string) => AnyBffToClientMessage,
  ): Observable<void> {
    return targetedClientPlatformAction<void>(this.client, {
      outgoingMessage,
    });
  }

  private bindEvents(config: RecordingEventConfig): void {
    (Object.keys(EVENT_FIELDS) as (keyof RecordingEventConfig)[]).forEach(
      (field) => {
        const actions = config[field];
        if (actions === undefined) {
          return;
        }
        const list = (Array.isArray(actions) ? actions : [actions]).map(
          (action) => this.parseAction(action as RecordingAction<unknown>),
        );
        this.handlers.set(EVENT_FIELDS[field], list);
      },
    );
  }

  private parseAction(action: RecordingAction<unknown>): ParsedRecordingAction {
    if (action instanceof LocalAction || action instanceof ServerAction) {
      return action;
    }
    if (action instanceof Action) {
      throw new Error(
        "Recording events accept LocalAction, ServerAction, or a server function",
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
          (message): message is RecordingIncomingEvent =>
            isRecordingIncomingEvent(message) && message.target === this.id,
        ),
      )
      .subscribe(
        incomingMessageObserver(this.client, (message) => {
          const parsed = recordingEventSchema(message).safeParse(
            message.payload,
          );
          if (!parsed.success) {
            this.client.error$.next(
              `Invalid recording event payload: ${message.type}`,
            );
            return;
          }
          const { handlers, ...payload } = parsed.data;
          this.emit(recordingEventName(message), payload, handlers);
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
