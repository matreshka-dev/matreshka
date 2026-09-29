import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServerComponentClass } from '@shared/enums/server-component-class';
import type { NestedItemsSyncPayload } from '@shared/messages/bff-to-client/components/nested-items/nested-items-sync-message';
import { NestedItemsSyncMessage } from '@shared/messages/bff-to-client/components/nested-items/nested-items-sync-message';
import type { MapConfig, SerializedMapMarker } from '@shared/types/map-config';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PLATFORM } from '../../../platforms/platform';
import { TestPlatform } from '../../../platforms/tests/test-platform';
import { ComponentHubService } from '../../../services/component-hub.service';
import { ContextHubService } from '../../../services/context-hub.service';
import { EnvironmentService } from '../../../services/environment.service';
import { PostmanService } from '../../../services/postman.service';
import { SsrService } from '../../../services/ssr.service';
import { TestPostmanService } from '../../../services/tests/test-postman.service';
import { TestSsrService } from '../../../services/tests/test-ssr.service';
import {
  ComponentDependencies,
  ServerComponentConfig,
} from '../server-component-config';
import { SERVER_COMPONENTS } from '../server-components-injection-token';
import { MapDependencies } from './map-config';
import { MapComponent } from './map.component';

describe('MapComponent nested items', () => {
  let fixture: ComponentFixture<MapComponent>;
  let component: MapComponent;
  let postman: TestPostmanService;
  let config: MapConfig;

  const configId = 'map-test-id';

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [MapComponent],
      providers: [
        ComponentHubService,
        ContextHubService,
        EnvironmentService,
        { provide: PostmanService, useClass: TestPostmanService },
        { provide: SsrService, useClass: TestSsrService },
        {
          provide: SERVER_COMPONENTS,
          useValue: {
            [ServerComponentClass.Map]: {
              component: MapComponent,
              dependencies: MapDependencies,
            },
            [ServerComponentClass.Text]: {
              dependencies: {
                pathsWithPlaceholdersInTemplate: [],
                pathsWithPlaceholdersInCode: [],
                requiredContextsPaths: [],
                getNestedConfigsPaths: vi.fn(() => []),
              } satisfies ComponentDependencies,
            },
          },
        },
        { provide: PLATFORM, useClass: TestPlatform },
      ],
    });

    postman = TestBed.inject(PostmanService) as unknown as TestPostmanService;
    const componentHub = TestBed.inject(ComponentHubService);

    const childConfig: ServerComponentConfig = {
      id: 'marker-child',
      class: ServerComponentClass.Text,
      properties: { value: 'A' },
    };

    config = {
      id: configId,
      class: ServerComponentClass.Map,
      properties: {
        apiKey: 'test-key',
        center: { latitude: 0, longitude: 0 },
        zoom: 10,
        markers: [
          {
            id: 'm1',
            coordinates: { latitude: 1, longitude: 2 },
            width: 100,
            component: childConfig,
          },
        ],
      },
    };

    componentHub.registerConfig(config);

    fixture = TestBed.createComponent(MapComponent);
    fixture.componentRef.setInput('id', configId);
    component = fixture.componentInstance;
    (
      component as unknown as { _configSignal: { set(value: MapConfig): void } }
    )._configSignal.set(config);
  });

  it('обновляет markers по NestedItemsSyncMessage', () => {
    component.ngOnInit();

    const nestedItems = () =>
      (
        component as unknown as {
          nestedItems: () => { id: string }[];
        }
      ).nestedItems();

    expect(nestedItems()).toHaveLength(1);

    const nextChild: ServerComponentConfig = {
      id: 'marker-child-2',
      class: ServerComponentClass.Text,
      properties: { value: 'B' },
    };

    const syncPayload: NestedItemsSyncPayload = {
      slot: 'markers',
      items: [
        {
          id: 'm2',
          coordinates: { latitude: 3, longitude: 4 },
          width: 80,
          component: nextChild,
        } as SerializedMapMarker,
      ],
    };

    postman.incomingMessage$.next(
      new NestedItemsSyncMessage(configId, syncPayload),
    );

    expect(nestedItems()).toHaveLength(1);
    expect(nestedItems()[0].id).toBe('m2');
  });
});
