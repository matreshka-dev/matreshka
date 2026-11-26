import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerComponentClass } from '@matreshka/client-bff-protocol/enums/server-component-class';
import { FilePickerSelectMessage } from '@matreshka/client-bff-protocol/messages/client-to-bff/components/file-picker/file-picker-select-message';
import type { FilePickerConfig } from '@matreshka/client-bff-protocol/types/file-picker-config';
import { TestPlatform } from '../../../../app/platforms/tests/test-platform';
import { PLATFORM, type Platform } from '../../../platforms/platform';
import { ComponentHubService } from '../../../services/component-hub.service';
import { ContextHubService } from '../../../services/context-hub.service';
import { EnvironmentService } from '../../../services/environment.service';
import { PostmanService } from '../../../services/postman.service';
import { SsrService } from '../../../services/ssr.service';
import { TestPostmanService } from '../../../services/tests/test-postman.service';
import { TestSsrService } from '../../../services/tests/test-ssr.service';
import { SERVER_COMPONENTS } from '../server-components-injection-token';
import { FilePickerDependencies } from './file-picker-config';
import { FilePickerComponent } from './file-picker.component';

describe('FilePickerComponent', () => {
  let fixture: ComponentFixture<FilePickerComponent>;
  let component: FilePickerComponent;
  let componentHub: ComponentHubService;
  let platform: Platform;
  let registerSpy: ReturnType<typeof vi.spyOn>;
  let config: FilePickerConfig;

  const configId = 'file-picker-test-id';
  const OriginalURL = globalThis.URL;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [FilePickerComponent],
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
            'file-picker': {
              component: FilePickerComponent,
              dependencies: FilePickerDependencies,
            },
          },
        },
        {
          provide: PLATFORM,
          useClass: TestPlatform,
        },
      ],
    });

    globalThis.URL = {
      ...OriginalURL,
      createObjectURL: vi.fn(() => 'blob:test-url'),
      revokeObjectURL: vi.fn(),
    } as unknown as typeof URL;

    componentHub = TestBed.inject(ComponentHubService);
    platform = TestBed.inject(PLATFORM);
    registerSpy = vi.spyOn(platform.localFileHost, 'register');

    config = {
      id: configId,
      class: ServerComponentClass.FilePicker,
      properties: {
        type: 'file-picker',
        multiple: true,
        content: [],
        accept: 'image/*',
      },
    };

    componentHub.registerConfig(config);

    fixture = TestBed.createComponent(FilePickerComponent);
    fixture.componentRef.setInput('id', configId);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture?.destroy();
    if (config) {
      componentHub.deleteConfig(config);
    }
    globalThis.URL = OriginalURL;
  });

  it('регистрирует файл и шлёт select без upload', () => {
    const file = {
      name: 'test.txt',
      size: 42,
      type: 'text/plain',
      lastModified: 1700000000000,
    } as File;

    const interactSpy = vi.spyOn(component, 'interact');

    component.fileSelected({
      target: { files: [file] },
    } as unknown as Event);

    expect(registerSpy).toHaveBeenCalledWith(
      expect.any(String),
      file,
      'blob:test-url',
      file.name,
    );

    expect(interactSpy).toHaveBeenCalledWith('select', expect.any(Function));
    const [, selectFactory] = interactSpy.mock.calls[0];
    const selectMessage = (selectFactory as () => FilePickerSelectMessage)();
    expect(selectMessage).toBeInstanceOf(FilePickerSelectMessage);
    expect(selectMessage.payload.files).toHaveLength(1);
    expect(selectMessage.payload.files[0]).toEqual(
      expect.objectContaining({
        type: file.type,
        size: file.size,
        name: file.name,
        lastModified: file.lastModified,
        url: 'blob:test-url',
      }),
    );

    expect(component.uploadInput()!.nativeElement.value).toBe('');
  });
});
