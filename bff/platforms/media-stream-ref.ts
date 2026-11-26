import { MediaKind } from "@matreshka/client-bff-protocol/enums/media-kind";
import { PlatformGetDisplayMediaMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/platform-get-display-media-message";
import { PlatformGetUserMediaMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/platform-get-user-media-message";
import { PlatformMediaStreamStopMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/platform-media-stream-stop-message";
import { PlatformMediaStreamSuccessMessage } from "@matreshka/client-bff-protocol/messages/client-to-bff/platforms/platform-media-stream-success-message";
import type {
  DisplayMediaStreamOptions,
  MediaStreamConstraints,
} from "@matreshka/client-bff-protocol/types/media-stream-constraints";
import { Observable, of, tap } from "rxjs";
import { z } from "zod";
import type { Client } from "../core/client";
import { targetedClientPlatformAction } from "./utils/targeted-client-platform-action";

export type { DisplayMediaStreamOptions, MediaStreamConstraints };

export type MediaStreamTrackInfo = {
  kind: MediaKind;
  label?: string;
  settings?: Record<string, unknown>;
};

const trackInfoSchema = z.strictObject({
  kind: z.enum(MediaKind),
  label: z.string().optional(),
  settings: z.record(z.string(), z.unknown()).optional(),
});

const mediaStreamSuccessSchema = z.strictObject({
  streamId: z.string(),
  tracks: z.array(trackInfoSchema),
});

/**
 * Ссылка на `MediaStream` на клиенте. Сам поток не сериализуется.
 */
export class MediaStreamRef {
  readonly id = "media-stream-" + crypto.randomUUID();
  private stopped = false;
  private trackInfos: MediaStreamTrackInfo[] = [];

  constructor(private readonly client: Client) {}

  get tracks(): readonly MediaStreamTrackInfo[] {
    return this.trackInfos;
  }

  /** Останавливает треки на клиенте и снимает поток из реестра. */
  stop(): Observable<void> {
    if (this.stopped) {
      return of(undefined);
    }
    return targetedClientPlatformAction<void>(this.client, {
      outgoingMessage: (scope) =>
        new PlatformMediaStreamStopMessage(scope, { streamId: this.id }),
    }).pipe(tap(() => this.markStopped()));
  }

  /** @internal */
  openUserMedia(constraints?: MediaStreamConstraints): Observable<this> {
    return this.open(
      (scope) =>
        new PlatformGetUserMediaMessage(scope, {
          streamId: this.id,
          constraints,
        }),
    );
  }

  /** @internal */
  openDisplayMedia(options?: DisplayMediaStreamOptions): Observable<this> {
    return this.open(
      (scope) =>
        new PlatformGetDisplayMediaMessage(scope, {
          streamId: this.id,
          options,
        }),
    );
  }

  private open(
    outgoingMessage: (
      scope: string,
    ) => PlatformGetUserMediaMessage | PlatformGetDisplayMediaMessage,
  ): Observable<this> {
    return targetedClientPlatformAction<this>(this.client, {
      outgoingMessage,
      parseSuccess: (unsafeMessage) => {
        if (!(unsafeMessage instanceof PlatformMediaStreamSuccessMessage)) {
          return;
        }
        const payload = mediaStreamSuccessSchema.parse(unsafeMessage.payload);
        if (payload.streamId !== this.id) {
          throw new Error(
            `Unexpected streamId ${payload.streamId}, expected ${this.id}`,
          );
        }
        this.trackInfos = payload.tracks;
        return this;
      },
    });
  }

  private markStopped(): void {
    this.stopped = true;
    this.trackInfos = [];
  }
}
