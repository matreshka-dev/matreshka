import {
  HttpClient,
  HttpErrorResponse,
  HttpEvent,
  HttpEventType,
} from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerComponentClass } from '@shared/enums/server-component-class';
import { FileUploadAreaCompleteMessage } from '@shared/messages/client-to-bff/components/file-upload-area/file-upload-area-complete-message';
import { FileUploadAreaErrorMessage } from '@shared/messages/client-to-bff/components/file-upload-area/file-upload-area-error-message';
import { FileUploadAreaProgressMessage } from '@shared/messages/client-to-bff/components/file-upload-area/file-upload-area-progress-message';
import { FileUploadAreaStartMessage } from '@shared/messages/client-to-bff/components/file-upload-area/file-upload-area-start-message';
import type { FileUploadAreaConfig } from '@shared/types/file-upload-area-config';
import { TestPlatform } from '../../../../app/platforms/tests/test-platform';
import { PLATFORM } from '../../../platforms/platform';
import { ComponentHubService } from '../../../services/component-hub.service';
import { ContextHubService } from '../../../services/context-hub.service';
import { EnvironmentService } from '../../../services/environment.service';
import { PostmanService } from '../../../services/postman.service';
import { SsrService } from '../../../services/ssr.service';
import { TestPostmanService } from '../../../services/tests/test-postman.service';
import { TestSsrService } from '../../../services/tests/test-ssr.service';
import { SERVER_COMPONENTS } from '../server-components-injection-token';
import { FileUploadAreaDependencies } from './file-upload-area-config';
import { FileUploadAreaComponent } from './file-upload-area.component';

class HttpClientStub {
  post = vi.fn();
}

describe('FileUploadAreaComponent', () => {
  let fixture: ComponentFixture<FileUploadAreaComponent>;
  let component: FileUploadAreaComponent;
  let componentHub: ComponentHubService;
  let http: HttpClientStub;
  let config: FileUploadAreaConfig;

  const configId = 'file-upload-area-test-id';

  const OriginalURL = globalThis.URL;
  const OriginalFormData = globalThis.FormData;

  class FakeFormData {
    entries: [string, unknown][] = [];

    append(key: string, value: unknown) {
      this.entries.push([key, value]);
    }
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FileUploadAreaComponent],
      providers: [
        ComponentHubService,
        EnvironmentService,
        ContextHubService,
        {
          provide: PostmanService,
          useClass: TestPostmanService,
        },
        {
          provide: SsrService,
          useClass: TestSsrService,
        },
        {
          provide: SERVER_COMPONENTS,
          useValue: {
            'file-upload-area': {
              component: FileUploadAreaComponent,
              dependencies: FileUploadAreaDependencies,
            },
          },
        },
        {
          provide: PLATFORM,
          useClass: TestPlatform,
        },
        {
          provide: HttpClient,
          useClass: HttpClientStub,
        },
      ],
    });

    // Подменяем глобальные URL/FormData, чтобы не зависеть от реализации JSDOM/Node
    globalThis.URL = {
      ...(OriginalURL ?? ({} as any)),
      createObjectURL: vi.fn(() => 'blob:test-url'),
      revokeObjectURL: vi.fn(),
    } as any;
    globalThis.FormData = FakeFormData as any;

    componentHub = TestBed.inject(ComponentHubService);
    http = TestBed.inject(HttpClient) as unknown as HttpClientStub;

    config = {
      id: configId,
      class: ServerComponentClass.FileUploadArea,
      properties: {
        type: 'file-upload-area',
        multiple: true,
        content: [],
        url: '/upload',
        accept: 'image/*',
      },
    };

    componentHub.registerConfig(config);

    fixture = TestBed.createComponent(FileUploadAreaComponent);
    fixture.componentRef.setInput('id', configId);
    component = fixture.componentInstance;

    // Инициализируем шаблон, чтобы viewChild uploadInput был доступен
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    componentHub.deleteConfig(config);

    // Возвращаем исходные значения глобальных объектов
    globalThis.URL = OriginalURL;
    globalThis.FormData = OriginalFormData;
  });

  it('должен отправлять start‑сообщение при выборе файла и очищать value у input', () => {
    const httpEvents$ = new Subject<HttpEvent<unknown>>();
    http.post.mockReturnValue(httpEvents$.asObservable());

    const file = {
      name: 'test.txt',
      size: 42,
      type: 'text/plain',
      lastModified: 1700000000000,
    } as File;

    const inputElement = component.uploadInput()!.nativeElement;
    const interactSpy = vi.spyOn(component, 'interact');

    component.fileSelected({
      target: { files: [file] },
    } as any);

    expect(http.post).toHaveBeenCalledTimes(1);
    const [url, body, options] = http.post.mock.calls[0];
    expect(url).toBe(config.properties.url);
    expect(body).toBeInstanceOf(FakeFormData);
    expect((body as FakeFormData).entries[0]).toEqual(['file', file]);
    expect(options).toEqual(
      expect.objectContaining({
        responseType: 'json',
        reportProgress: true,
        observe: 'events',
      }),
    );

    // Загрузка добавлена в карту активных загрузок
    expect(component.uploadMap.size).toBe(1);

    // Проверяем, что отправлено корректное start‑сообщение
    expect(interactSpy).toHaveBeenCalledWith('start', expect.any(Function));
    const [, startFactory] = interactSpy.mock.calls[0];
    const startMessage = (startFactory as () => any)();
    expect(startMessage).toBeInstanceOf(FileUploadAreaStartMessage);
    expect(startMessage.payload).toEqual(
      expect.objectContaining({
        type: file.type,
        size: file.size,
        name: file.name,
        lastModified: file.lastModified,
        url: 'blob:test-url',
      }),
    );
    expect(typeof startMessage.payload.id).toBe('string');

    // Значение HTML‑input должно очищаться
    expect(inputElement.value).toBe('');
  });

  it('должен отправлять progress‑сообщения только при росте процента загрузки', () => {
    const httpEvents$ = new Subject<HttpEvent<unknown>>();
    http.post.mockReturnValue(httpEvents$.asObservable());

    const file = {
      name: 'file.bin',
      size: 100,
      type: 'application/octet-stream',
      lastModified: 1,
    } as File;

    const interactSpy = vi.spyOn(component, 'interact');

    component.fileSelected({
      target: { files: [file] },
    } as any);

    // Первый вызов interact — это start, его очищаем
    interactSpy.mockClear();

    httpEvents$.next({
      type: HttpEventType.UploadProgress,
      loaded: 50,
      total: 100,
    });

    httpEvents$.next({
      type: HttpEventType.UploadProgress,
      loaded: 50,
      total: 100,
    });

    httpEvents$.next({
      type: HttpEventType.UploadProgress,
      loaded: 75,
      total: 100,
    });

    // Проверяем, что прогресс шлётся только при росте значения
    expect(interactSpy).toHaveBeenCalled();

    const progresses = interactSpy.mock.calls.map(([, factory]) => {
      const message = (factory as () => any)();
      expect(message).toBeInstanceOf(FileUploadAreaProgressMessage);
      expect(typeof message.payload.id).toBe('string');
      return message.payload.progress;
    });

    // Проверяем, что прогресс вообще шлётся и доходит до 75%
    expect(progresses.length).toBeGreaterThan(0);
    expect(Math.max(...progresses)).toBe(75);
    expect(progresses.every((value) => value > 0 && value <= 100)).toBe(true);
  });

  it('должен отправлять complete‑сообщение и удалять загрузку из uploadMap после успешного ответа', () => {
    const httpEvents$ = new Subject<HttpEvent<unknown>>();
    http.post.mockReturnValue(httpEvents$.asObservable());

    const file = {
      name: 'success.txt',
      size: 10,
      type: 'text/plain',
      lastModified: 2,
    } as File;

    const interactSpy = vi.spyOn(component, 'interact');

    component.fileSelected({
      target: { files: [file] },
    } as any);

    // Был вызван start, очищаем историю
    interactSpy.mockClear();

    const responseBody = { ok: true };
    httpEvents$.next({
      type: HttpEventType.Response,
      body: responseBody,
    } as HttpEvent<unknown>);

    expect(interactSpy).toHaveBeenCalledTimes(1);
    const [type, factory] = interactSpy.mock.calls[0];
    const message = (factory as () => any)();

    expect(type).toBe('complete');
    expect(message).toBeInstanceOf(FileUploadAreaCompleteMessage);
    expect(message.payload).toEqual(
      expect.objectContaining({
        response: responseBody,
      }),
    );
    expect(typeof message.payload.id).toBe('string');

    // После успешной загрузки запись должна быть удалена
    expect(component.uploadMap.size).toBe(0);

    // Blob‑URL должен быть освобождён
    expect((globalThis.URL as any).revokeObjectURL).toHaveBeenCalledWith(
      'blob:test-url',
    );
  });

  it('должен отправлять error‑сообщение и удалять загрузку из uploadMap при ошибке', () => {
    const httpEvents$ = new Subject<HttpEvent<unknown>>();
    http.post.mockReturnValue(httpEvents$.asObservable());

    const file = {
      name: 'error.txt',
      size: 5,
      type: 'text/plain',
      lastModified: 3,
    } as File;

    const interactSpy = vi.spyOn(component, 'interact');

    component.fileSelected({
      target: { files: [file] },
    } as any);

    // Был вызван start, очищаем историю
    interactSpy.mockClear();

    const errorResponse = new HttpErrorResponse({
      status: 500,
      error: { message: 'upload failed' },
    });

    httpEvents$.error(errorResponse);

    expect(interactSpy).toHaveBeenCalledTimes(1);
    const [type, factory] = interactSpy.mock.calls[0];
    const message = (factory as () => any)();

    expect(type).toBe('error');
    expect(message).toBeInstanceOf(FileUploadAreaErrorMessage);
    expect(message.payload).toEqual(
      expect.objectContaining({
        response: errorResponse.error,
        code: errorResponse.status,
      }),
    );
    expect(typeof message.payload.id).toBe('string');

    // Загрузка должна быть удалена из карты даже при ошибке
    expect(component.uploadMap.size).toBe(0);

    // Blob‑URL должен быть освобождён и при ошибке
    expect((globalThis.URL as any).revokeObjectURL).toHaveBeenCalledWith(
      'blob:test-url',
    );
  });
});
