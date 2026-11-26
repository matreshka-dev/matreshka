import type { AnyBffToClientMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/bff-to-client-message';
import { LocalFileDestroyMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/local-file-destroy-message';
import { LocalFileUploadAbortMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/local-file-upload-abort-message';
import { LocalFileUploadMessage } from '@matreshka/client-bff-protocol/messages/bff-to-client/platforms/local-file-upload-message';
import { LocalFileUploadProgressMessage } from '@matreshka/client-bff-protocol/messages/client-to-bff/platforms/local-file-upload-progress-message';
import { LocalFileUploadSuccessMessage } from '@matreshka/client-bff-protocol/messages/client-to-bff/platforms/local-file-upload-success-message';
import { PostmanService } from '../services/postman.service';
import {
  completeTargetedAction,
  failTargetedAction,
} from '../utils/targeted-action';

type LocalFileEntry = {
  data: Blob;
  objectUrl: string;
  name: string;
};

/**
 * Реестр клиентских blob/File и загрузки по команде BFF.
 */
export class ClientLocalFileHost {
  private readonly files = new Map<string, LocalFileEntry>();
  private readonly uploads = new Map<string, XMLHttpRequest>();

  constructor(private readonly postman: PostmanService) {}

  handle(message: AnyBffToClientMessage): boolean {
    if (message instanceof LocalFileUploadMessage) {
      this.upload(message);
      return true;
    }
    if (message instanceof LocalFileUploadAbortMessage) {
      this.abortUpload(message.target);
      return true;
    }
    if (message instanceof LocalFileDestroyMessage) {
      void this.destroy(message);
      return true;
    }
    return false;
  }

  /** Регистрирует файл (picker или recording.stop). */
  register(fileId: string, data: Blob, objectUrl: string, name: string): void {
    if (this.files.has(fileId)) {
      throw new Error(`LocalFile ${fileId} already exists`);
    }
    this.files.set(fileId, { data, objectUrl, name });
  }

  get(fileId: string): LocalFileEntry | undefined {
    return this.files.get(fileId);
  }

  private upload(message: LocalFileUploadMessage): void {
    const { fileId, url, fieldName, headers, fields } = message.payload;
    const entry = this.files.get(fileId);
    if (!entry) {
      failTargetedAction(
        this.postman,
        message.target,
        new Error(`LocalFile ${fileId} not found`),
      );
      return;
    }

    const data = new FormData();
    if (fields) {
      for (const [key, value] of Object.entries(fields)) {
        data.append(key, value);
      }
    }
    data.append(fieldName ?? 'file', entry.data, entry.name);

    const xhr = new XMLHttpRequest();
    this.uploads.set(message.target, xhr);

    let progress = 0;
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }
      const nextProgress = Math.floor((event.loaded / event.total) * 100);
      if (nextProgress > progress) {
        progress = nextProgress;
        this.postman.outcomingMessage$.next(
          new LocalFileUploadProgressMessage(message.target, {
            progress,
          }),
        );
      }
    };

    xhr.onload = () => {
      this.uploads.delete(message.target);
      if (xhr.status >= 200 && xhr.status < 300) {
        let response: unknown = xhr.responseText;
        try {
          response = xhr.responseText ? JSON.parse(xhr.responseText) : null;
        } catch {
          // оставляем текст ответа
        }
        this.postman.outcomingMessage$.next(
          new LocalFileUploadSuccessMessage(message.target, { response }),
        );
        completeTargetedAction(this.postman, message.target);
        return;
      }
      failTargetedAction(
        this.postman,
        message.target,
        new Error(`Upload failed (${xhr.status})`),
      );
    };

    xhr.onerror = () => {
      this.uploads.delete(message.target);
      failTargetedAction(
        this.postman,
        message.target,
        new Error('Upload failed (network error)'),
      );
    };

    xhr.onabort = () => {
      this.uploads.delete(message.target);
    };

    xhr.open('POST', url);
    if (headers) {
      for (const [key, value] of Object.entries(headers)) {
        xhr.setRequestHeader(key, value);
      }
    }
    xhr.send(data);
  }

  private abortUpload(target: string): void {
    const xhr = this.uploads.get(target);
    if (xhr) {
      xhr.abort();
      this.uploads.delete(target);
    }
  }

  private async destroy(message: LocalFileDestroyMessage): Promise<void> {
    try {
      const entry = this.files.get(message.payload.fileId);
      if (entry) {
        URL.revokeObjectURL(entry.objectUrl);
        this.files.delete(message.payload.fileId);
      }
      completeTargetedAction(this.postman, message.target);
    } catch (error) {
      failTargetedAction(this.postman, message.target, error);
    }
  }
}
