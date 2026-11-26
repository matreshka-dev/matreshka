import { MediaKind } from "@matreshka/client-bff-protocol/enums/media-kind";
import { LocalFileDestroyMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/local-file-destroy-message";
import { LocalFileUploadAbortMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/local-file-upload-abort-message";
import { LocalFileUploadMessage } from "@matreshka/client-bff-protocol/messages/bff-to-client/platforms/local-file-upload-message";
import { LocalFileUploadProgressMessage } from "@matreshka/client-bff-protocol/messages/client-to-bff/platforms/local-file-upload-progress-message";
import { LocalFileUploadSuccessMessage } from "@matreshka/client-bff-protocol/messages/client-to-bff/platforms/local-file-upload-success-message";
import { Observable, of, tap } from "rxjs";
import { z } from "zod";
import type { Client } from "../core/client";
import { targetedClientPlatformAction } from "./utils/targeted-client-platform-action";
import { targetedClientPlatformStream } from "./utils/targeted-client-platform-stream";

export { MediaKind };

export class LocalFileUploadProgress {
  constructor(public readonly progress: number) {}
}

export class LocalFileUploadResponse {
  constructor(public readonly response: unknown) {}
}

export type LocalFileUploadEvent =
  | LocalFileUploadProgress
  | LocalFileUploadResponse;

export type LocalFileUploadOptions = {
  url: string;
  fieldName?: string;
  headers?: Record<string, string>;
  fields?: Record<string, string>;
};

export type LocalFileInit = {
  id: string;
  url: string;
  type: string;
  size: number;
  name: string;
  lastModified: number;
  duration?: number;
  kind?: MediaKind;
};

const localFileInitSchema = z.strictObject({
  id: z.string(),
  url: z.string().refine((val) => val.startsWith("blob:"), {
    message: "url must be a blob",
  }),
  type: z.string(),
  size: z.number(),
  name: z.string(),
  lastModified: z.number(),
  duration: z.number().optional(),
  kind: z.enum(MediaKind).optional(),
});

/**
 * Handle на клиентский blob/File: upload и destroy с BFF.
 */
export class LocalFile {
  readonly id: string;
  readonly name: string;
  readonly type: string;
  readonly size: number;
  readonly lastModified: number;
  readonly url: string;
  readonly duration?: number;
  readonly kind?: MediaKind;
  private destroyed = false;

  constructor(
    private readonly client: Client,
    init: LocalFileInit,
  ) {
    const safe = localFileInitSchema.parse(init);
    this.id = safe.id;
    this.name = safe.name;
    this.type = safe.type;
    this.size = safe.size;
    this.lastModified = safe.lastModified;
    this.url = safe.url;
    this.duration = safe.duration;
    this.kind = safe.kind;
  }

  /**
   * POST multipart на endpoint. Эмитит progress, затем response, затем complete.
   * Отписка всех observers abort'ит загрузку на клиенте.
   */
  upload(options: LocalFileUploadOptions): Observable<LocalFileUploadEvent> {
    this.assertAlive();
    return targetedClientPlatformStream(this.client, {
      outgoingMessage: (scope) =>
        new LocalFileUploadMessage(scope, {
          fileId: this.id,
          url: options.url,
          fieldName: options.fieldName,
          headers: options.headers,
          fields: options.fields,
        }),
      parseItem: (unsafeMessage) => {
        if (unsafeMessage instanceof LocalFileUploadProgressMessage) {
          const progress = z
            .number()
            .min(0)
            .max(100)
            .parse(unsafeMessage.payload.progress);
          return new LocalFileUploadProgress(progress);
        }
        if (unsafeMessage instanceof LocalFileUploadSuccessMessage) {
          return new LocalFileUploadResponse(unsafeMessage.payload.response);
        }
      },
      onTeardown: (scope, client) => {
        client.outcomingMessage$.next(new LocalFileUploadAbortMessage(scope));
      },
    });
  }

  /** Освобождает blob на клиенте. */
  destroy(): Observable<void> {
    if (this.destroyed) {
      return of(undefined);
    }
    return targetedClientPlatformAction<void>(this.client, {
      outgoingMessage: (scope) =>
        new LocalFileDestroyMessage(scope, { fileId: this.id }),
    }).pipe(tap(() => this.markDestroyed()));
  }

  private assertAlive(): void {
    if (this.destroyed) {
      throw new Error(`LocalFile ${this.id} has been destroyed`);
    }
  }

  private markDestroyed(): void {
    this.destroyed = true;
  }
}
