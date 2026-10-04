import { Component, Input } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ColorRole } from '@shared/enums/color-role';
import { ServerComponentClass } from '@shared/enums/server-component-class';
import { OverlayAnchor } from '@shared/types/container-overlay';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { ComponentHubService } from '../../../services/component-hub.service';
import { SERVER_COMPONENTS_LIST_COMPONENT } from '../../../tokens/server-components-list-component';
import * as colorRegister from '../../../utils/register-colors';
import { ServerComponentConfig } from '../server-component-config';
import { SERVER_COMPONENTS } from '../server-components-injection-token';
import { ServerComponentWrapperComponent } from './server-component-wrapper.component';

describe('ServerComponentWrapperComponent', () => {
  let component: ServerComponentWrapperComponent;
  let fixture: ComponentFixture<ServerComponentWrapperComponent>;
  let componentHub: ComponentHubService;
  let config: ServerComponentConfig;
  const configId = 'wrapper-test-id';

  @Component({
    selector: 'app-dummy-server-component',
    template: '',
    standalone: true,
  })
  class DummyServerComponent {
    @Input({ required: true }) id!: string;
  }

  @Component({
    selector: 'app-stub-components-list',
    template: '',
    standalone: true,
  })
  class StubComponentsListComponent {
    @Input({ required: true }) components!: ServerComponentConfig[];
  }

  function setWrapperConfig(next: ServerComponentConfig): void {
    (
      component as unknown as {
        _configSignal: { set(value: ServerComponentConfig): void };
      }
    )._configSignal.set(next);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerComponentWrapperComponent],
      providers: [
        ComponentHubService,
        {
          provide: SERVER_COMPONENTS,
          useValue: {
            [ServerComponentClass.UnitTestDummy]: {
              component: DummyServerComponent,
              dependencies: {
                pathsWithPlaceholdersInTemplate: [],
                pathsWithPlaceholdersInCode: [],
                requiredContextsPaths: [],
                getNestedConfigsPaths: () => [],
              },
            },
          },
        },
        {
          provide: SERVER_COMPONENTS_LIST_COMPONENT,
          useValue: StubComponentsListComponent,
        },
      ],
    }).compileComponents();

    componentHub = TestBed.inject(ComponentHubService);
    config = {
      id: configId,
      class: ServerComponentClass.UnitTestDummy,
    };
    componentHub.registerConfig(config);

    fixture = TestBed.createComponent(ServerComponentWrapperComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('id', configId);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    fixture.destroy();
    componentHub.deleteConfig(config);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('colors на хосте wrapper', () => {
    beforeEach(() => {
      colorRegister.registerColors({
        'test-scheme-1': {
          default: '#000000',
        },
        'test-scheme-2': {
          default: '#ffffff',
        },
      });
    });

    it('должен добавлять CSS‑классы для каждой роли из config.properties.colors', () => {
      setWrapperConfig({
        ...config,
        properties: {
          colors: {
            [ColorRole.Background]: 'test-scheme-1',
            [ColorRole.Text]: 'test-scheme-2',
          },
        },
      });

      const host: HTMLElement = fixture.nativeElement;
      expect(
        host.classList.contains('color-token-test-scheme-1-background'),
      ).toBe(true);
      expect(host.classList.contains('color-token-test-scheme-2-text')).toBe(
        true,
      );
    });

    it('должен применять colors при overlays в config', () => {
      const overlayChild: ServerComponentConfig = {
        id: 'overlay-child',
        class: ServerComponentClass.UnitTestDummy,
      };
      componentHub.registerConfig(overlayChild, configId);

      setWrapperConfig({
        ...config,
        properties: {
          colors: {
            [ColorRole.Background]: 'test-scheme-1',
          },
          overlays: [
            {
              anchors: [OverlayAnchor.Bottom, OverlayAnchor.Center],
              component: overlayChild,
            },
          ],
        },
      });

      const host: HTMLElement = fixture.nativeElement;
      expect(
        host.classList.contains('color-token-test-scheme-1-background'),
      ).toBe(true);
    });

    it('не должен добавлять color-классы, если colors не задан', () => {
      setWrapperConfig({
        ...config,
        properties: {},
      });

      const host: HTMLElement = fixture.nativeElement;
      expect(
        Array.from(host.classList).some((cls) =>
          cls.startsWith('color-token-'),
        ),
      ).toBe(false);
    });
  });
});
