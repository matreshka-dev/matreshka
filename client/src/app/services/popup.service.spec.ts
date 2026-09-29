import { DOCUMENT } from '@angular/common';
import { ApplicationRef, ComponentRef, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServerComponentWrapperComponent } from '../components/server/server-component-wrapper/server-component-wrapper.component';
import { ComponentHubService } from './component-hub.service';
import { PopupService } from './popup.service';
import { PostmanService } from './postman.service';

describe('PopupService', () => {
  let service: PopupService;
  let componentHub: {
    beginEntryDestroy: ReturnType<typeof vi.fn>;
    endEntryDestroy: ReturnType<typeof vi.fn>;
    getInstancesByComponentId: ReturnType<typeof vi.fn>;
  };
  let appRef: {
    detachView: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    componentHub = {
      beginEntryDestroy: vi.fn(),
      endEntryDestroy: vi.fn(),
      getInstancesByComponentId: vi.fn(() => []),
    };
    appRef = {
      detachView: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        PopupService,
        {
          provide: Router,
          useValue: {
            events: new Subject(),
          },
        },
        {
          provide: ComponentHubService,
          useValue: componentHub,
        },
        {
          provide: PostmanService,
          useValue: {
            incomingMessage$: new Subject(),
          },
        },
        {
          provide: ApplicationRef,
          useValue: appRef,
        },
        {
          provide: PLATFORM_ID,
          useValue: 'browser',
        },
        {
          provide: DOCUMENT,
          useValue: document,
        },
      ],
    });

    service = TestBed.inject(PopupService);
  });

  it('оборачивает destroy popup entry в begin/end entry destroy', () => {
    const ref = {
      hostView: {},
      destroy: vi.fn(),
    } as unknown as ComponentRef<ServerComponentWrapperComponent>;
    const cleanup = vi.fn();

    (
      service as unknown as {
        destroyEntryRef: (
          configId: string,
          ref: ComponentRef<ServerComponentWrapperComponent>,
          cleanup: () => void,
        ) => void;
      }
    ).destroyEntryRef('dialog-root', ref, cleanup);

    expect(componentHub.beginEntryDestroy).toHaveBeenCalledWith('dialog-root');
    expect(cleanup).toHaveBeenCalled();
    expect(appRef.detachView).toHaveBeenCalledWith(ref.hostView);
    expect(ref.destroy).toHaveBeenCalled();
    expect(componentHub.endEntryDestroy).toHaveBeenCalledWith('dialog-root');
  });
});
