import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FileUploadAreaCompleteMessage } from '@shared/messages/client-to-bff/components/file-upload-area/file-upload-area-complete-message';
import { FileUploadAreaErrorMessage } from '@shared/messages/client-to-bff/components/file-upload-area/file-upload-area-error-message';
import { FileUploadAreaProgressMessage } from '@shared/messages/client-to-bff/components/file-upload-area/file-upload-area-progress-message';
import { FileUploadAreaStartMessage } from '@shared/messages/client-to-bff/components/file-upload-area/file-upload-area-start-message';
import type { FileUploadAreaConfig } from '@shared/types/file-upload-area-config';
import { Subscription } from 'rxjs';
import { randomString } from '../../../utils/random-string';
import { ServerComponent } from '../server-component';
import { ServerComponentsListComponent } from '../server-components-list/server-components-list.component';

@Component({
  selector: 'app-file-upload-area',
  imports: [ServerComponentsListComponent],
  templateUrl: './file-upload-area.component.html',
  styleUrl: './file-upload-area.component.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(dragover)': 'fileOver.set(true)',
    '(dragleave)': 'fileOver.set(false)',
  },
})
export class FileUploadAreaComponent extends ServerComponent<FileUploadAreaConfig> {
  uploadInput = viewChild<ElementRef<HTMLInputElement>>('input');
  fileOver = signal(false);
  http = inject(HttpClient);
  uploadMap = new Map<string, Subscription>();
  uploadUrls = new Map<string, string>();

  fileSelected(event: Event) {
    const input = event.target as HTMLInputElement | null;
    const files = input?.files;

    if (!files?.length) {
      return;
    }

    Array.from(files).forEach((file: File) => {
      const data = new FormData();
      data.append('file', file);

      const uploadId = randomString(16);

      const blobUrl = URL.createObjectURL(file);

      // Генерируем ссылку на blob файла и сохраняем её для последующего освобождения
      this.uploadUrls.set(uploadId, blobUrl);

      this.interact(
        'start',
        () =>
          new FileUploadAreaStartMessage(this.id(), {
            id: uploadId,
            type: file.type,
            size: file.size,
            name: file.name,
            lastModified: file.lastModified,
            url: blobUrl,
          }),
      );
      let progress = 0;

      const uploadSubscription = this.http
        .post(this.config.properties.url, data, {
          responseType: 'json',
          reportProgress: true,
          observe: 'events',
        })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (event: HttpEvent<any>) => {
            switch (event.type) {
              case HttpEventType.UploadProgress:
                const newProgress = Math.floor(
                  (event.loaded / event.total!) * 100,
                );
                if (newProgress > progress) {
                  progress = newProgress;
                  this.interact(
                    'progress',
                    () =>
                      new FileUploadAreaProgressMessage(this.id(), {
                        id: uploadId,
                        progress: progress,
                      }),
                  );
                }
                break;
              case HttpEventType.Response:
                const response = event.body;
                this.interact(
                  'complete',
                  () =>
                    new FileUploadAreaCompleteMessage(this.id(), {
                      id: uploadId,
                      response: response,
                    }),
                );
                this.cleanupUpload(uploadId);
                break;
            }
          },
          error: (response: HttpErrorResponse) => {
            this.interact(
              'error',
              () =>
                new FileUploadAreaErrorMessage(this.id(), {
                  id: uploadId,
                  response: response.error,
                  code: response.status,
                }),
            );
            this.cleanupUpload(uploadId);
          },
        });

      this.uploadMap.set(uploadId, uploadSubscription);
    });
    this.uploadInput()!.nativeElement.value = '';
  }

  private cleanupUpload(uploadId: string) {
    const blobUrl = this.uploadUrls.get(uploadId);
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
      this.uploadUrls.delete(uploadId);
    }
    this.uploadMap.delete(uploadId);
  }
}
