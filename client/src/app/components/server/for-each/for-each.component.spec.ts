import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerComponentClass } from '@shared/enums/server-component-class';
import { ForEachSyncComponentsMessage } from '@shared/messages/bff-to-client/components/for-each/for-each-sync-components-message';
import {
  ContextInitMessage as BffContextInitMessage,
  ContextValuesMessage as BffContextValuesMessage,
} from '@shared/messages/bff-to-client/context';
import type { ForEachConfig } from '@shared/types/for-each-config';
import { PLATFORM } from '../../../platforms/platform';
import { TestPlatform } from '../../../platforms/tests/test-platform';
import { ComponentHubService } from '../../../services/component-hub.service';
import { ContextHubService } from '../../../services/context-hub.service';
import { EnvironmentService } from '../../../services/environment.service';
import { PostmanService } from '../../../services/postman.service';
import { SsrService } from '../../../services/ssr.service';
import { TestPostmanService } from '../../../services/tests/test-postman.service';
import { TestSsrService } from '../../../services/tests/test-ssr.service';
import { ServerComponent } from '../server-component';
import {
  ComponentDependencies,
  ServerComponentConfig,
} from '../server-component-config';
import { SERVER_COMPONENTS } from '../server-components-injection-token';
import { ForEachComponent } from './for-each.component';

describe('ForEachComponent', () => {
  let fixture: ComponentFixture<ForEachComponent>;
  let component: ForEachComponent;
  let componentHub: ComponentHubService;
  let contextHub: ContextHubService;
  let postman: TestPostmanService;

  const configId = 'for-each-test-id';
  let config: ForEachConfig;

  beforeEach(() => {
    const defaultDependencies: ComponentDependencies = {
      pathsWithPlaceholdersInTemplate: [],
      pathsWithPlaceholdersInCode: [],
      requiredContextsPaths: [],
      getNestedConfigsPaths: vi.fn(() => []),
    };

    TestBed.configureTestingModule({
      imports: [ForEachComponent],
      providers: [
        ComponentHubService,
        ContextHubService,
        EnvironmentService,
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
            [ServerComponentClass.ForEach]: {
              component: ForEachComponent,
              dependencies: defaultDependencies,
            },
            [ServerComponentClass.UnitTest]: {
              dependencies: defaultDependencies,
            },
          },
        },
        {
          provide: PLATFORM,
          useClass: TestPlatform,
        },
      ],
    });

    componentHub = TestBed.inject(ComponentHubService);
    contextHub = TestBed.inject(ContextHubService);
    postman = TestBed.inject(PostmanService) as unknown as TestPostmanService;

    config = {
      id: configId,
      class: ServerComponentClass.ForEach,
      properties: {
        ref: 'unused',
        componentContext: 'unused',
      },
    };

    componentHub.registerConfig(config);

    fixture = TestBed.createComponent(ForEachComponent);
    fixture.componentRef.setInput('id', configId);
    component = fixture.componentInstance;
    (
      component as unknown as {
        _configSignal: { set(value: ForEachConfig): void };
      }
    )._configSignal.set(config);
  });

  afterEach(() => {
    fixture.destroy();
    componentHub.deleteConfig(config);
  });

  describe('SSR‑задача', () => {
    it('должен создавать SSR‑задачу при создании и очищать её при получении ForEachSyncComponentsMessage', () => {
      const ssr = TestBed.inject(SsrService) as unknown as TestSsrService;

      // При создании компонента должна быть зарегистрирована задача
      expect(ssr.addTask).toHaveBeenCalledTimes(1);
      const initTask = ssr.addTask.mock.results[0].value;

      const syncConfigsSpy = vi.spyOn(component, 'syncComponentConfigs');
      const setElementsSpy = vi.spyOn(component, 'setElementsComponents');

      component.ngOnInit();

      const payload: ServerComponentConfig[][] = [
        [
          {
            id: 'child-1',
            class: ServerComponentClass.UnitTest,
          },
        ],
      ];

      postman.incomingMessage$.next(
        new ForEachSyncComponentsMessage(configId, payload),
      );

      expect(syncConfigsSpy).toHaveBeenCalledTimes(1);
      expect(syncConfigsSpy).toHaveBeenCalledWith(payload);
      expect(setElementsSpy).toHaveBeenCalledTimes(1);
      expect(setElementsSpy).toHaveBeenCalledWith(payload);

      expect(ssr.cleanupTask).toHaveBeenCalledTimes(1);
      expect(ssr.cleanupTask).toHaveBeenCalledWith(initTask);
    });

    it('должен игнорировать сообщения с другим scope', () => {
      const ssr = TestBed.inject(SsrService) as unknown as TestSsrService;

      expect(ssr.addTask).toHaveBeenCalledTimes(1);

      const syncConfigsSpy = vi.spyOn(component, 'syncComponentConfigs');
      const setElementsSpy = vi.spyOn(component, 'setElementsComponents');

      component.ngOnInit();

      const payload: ServerComponentConfig[][] = [
        [
          {
            id: 'child-1',
            class: ServerComponentClass.UnitTest,
          },
        ],
      ];

      // Сообщение для другого компонента
      postman.incomingMessage$.next(
        new ForEachSyncComponentsMessage('other-id', payload),
      );

      expect(syncConfigsSpy).not.toHaveBeenCalled();
      expect(setElementsSpy).not.toHaveBeenCalled();
      expect(ssr.cleanupTask).not.toHaveBeenCalled();
    });
  });

  describe('setElementsComponents', () => {
    it('должен обновлять сигнал elementsComponents', () => {
      const components: ServerComponentConfig[][] = [
        [
          {
            id: 'row-1',
            class: ServerComponentClass.UnitTest,
          },
        ],
      ];

      component.setElementsComponents(components);

      expect(component.elementsComponents()).toEqual(components);
    });
  });

  describe('syncComponentConfigs', () => {
    it('должен регистрировать новые компоненты и удалять старые', () => {
      const oldComponents: ServerComponentConfig[][] = [
        [
          {
            id: 'old-1',
            class: ServerComponentClass.UnitTest,
          },
        ],
      ];
      component.setElementsComponents(oldComponents);

      const newComponents: ServerComponentConfig[][] = [
        [
          {
            id: 'new-1',
            class: ServerComponentClass.UnitTest,
          },
        ],
      ];

      const registerSpy = vi.spyOn(componentHub, 'registerConfig');
      const deleteSpy = vi.spyOn(componentHub, 'deleteConfig');

      component.syncComponentConfigs(newComponents);

      expect(registerSpy).toHaveBeenCalledWith(newComponents[0][0]);
      expect(deleteSpy).toHaveBeenCalledWith(oldComponents[0][0]);
      expect(component.elementsComponents()).toEqual(newComponents);
    });

    it('при deferred hide удаляет конфиг после setElementsComponents', async () => {
      const hideInteraction = {
        class: 'animate-component' as const,
        payload: { duration: 0, effects: {} },
      };
      const oldRow = {
        id: 'old-deferred',
        class: ServerComponentClass.UnitTest,
        interactions: { hide: [hideInteraction] },
      } as ServerComponentConfig;
      component.setElementsComponents([[oldRow]]);
      componentHub.registerConfig(oldRow);

      const mockInstance = {
        animateInteraction: vi.fn(() => Promise.resolve([])),
      };
      componentHub.addInstance(
        'old-deferred',
        mockInstance as unknown as ServerComponent<ServerComponentConfig>,
      );

      const deleteSpy = vi.spyOn(componentHub, 'deleteConfig');
      const setElementsSpy = vi.spyOn(component, 'setElementsComponents');
      const callOrder: string[] = [];
      setElementsSpy.mockImplementation((rows) => {
        callOrder.push('setElements');
        component.elementsComponents.set(rows);
      });
      deleteSpy.mockImplementation((cfg) => {
        callOrder.push(`delete:${cfg.id}`);
      });

      const newComponents: ServerComponentConfig[][] = [
        [
          {
            id: 'new-1',
            class: ServerComponentClass.UnitTest,
          },
        ],
      ];

      component.syncComponentConfigs(newComponents);
      await fixture.whenStable();

      expect(mockInstance.animateInteraction).toHaveBeenCalledWith('hide');
      expect(callOrder.indexOf('delete:old-deferred')).toBeGreaterThan(-1);
      expect(callOrder.indexOf('setElements')).toBeLessThan(
        callOrder.indexOf('delete:old-deferred'),
      );
    });
  });

  describe('subscribeListRefFreeze', () => {
    const contextId = 'ctx-for-each-freeze';
    const listRef = `${contextId}.items`;

    function initContext(
      items: { key: string; progress: number }[] = [],
    ): void {
      contextHub.init$(contextId).subscribe();
      postman.incomingMessage$.next(
        new BffContextInitMessage(contextId, { items }),
      );
    }

    function mountForEachWithListRef(): void {
      config = {
        id: configId,
        class: ServerComponentClass.ForEach,
        properties: {
          ref: listRef,
          componentContext: 'unused',
        },
      };
      componentHub.registerConfig(config);
      (
        component as unknown as {
          _configSignal: { set(value: ForEachConfig): void };
        }
      )._configSignal.set(config);
      component.setElementsComponents([
        [
          {
            id: 'row-1',
            class: ServerComponentClass.UnitTest,
          },
        ],
      ]);
      componentHub.registerConfig({
        id: 'row-1',
        class: ServerComponentClass.UnitTest,
      });
      component.ngOnInit();
    }

    it('не замораживает строки при обновлении полей элементов списка', () => {
      initContext([{ key: 'upload-1', progress: 0 }]);
      mountForEachWithListRef();

      const freezeSpy = vi.spyOn(componentHub, 'freezeConfigSubtree');

      postman.incomingMessage$.next(
        new BffContextValuesMessage(contextId, [
          {
            key: 'items',
            value: [{ key: 'upload-1', progress: 42 }],
          },
        ]),
      );

      expect(freezeSpy).not.toHaveBeenCalled();
    });

    it('замораживает строки при изменении структуры списка', () => {
      initContext([{ key: 'upload-1', progress: 0 }]);
      mountForEachWithListRef();

      const freezeSpy = vi.spyOn(componentHub, 'freezeConfigSubtree');

      postman.incomingMessage$.next(
        new BffContextValuesMessage(contextId, [
          {
            key: 'items',
            value: [
              { key: 'upload-1', progress: 0 },
              { key: 'upload-2', progress: 0 },
            ],
          },
        ]),
      );

      expect(freezeSpy).toHaveBeenCalledTimes(1);
    });
  });

  describe('ngOnDestroy', () => {
    it('должен удалять все зарегистрированные компоненты при уничтожении', () => {
      const components: ServerComponentConfig[][] = [
        [
          {
            id: 'child-1',
            class: ServerComponentClass.UnitTest,
          },
        ],
        [
          {
            id: 'child-2',
            class: ServerComponentClass.UnitTest,
          },
        ],
      ];
      component.setElementsComponents(components);

      const deleteSpy = vi.spyOn(componentHub, 'deleteConfig');

      fixture.destroy();

      expect(deleteSpy).toHaveBeenCalledTimes(2);
      expect(deleteSpy).toHaveBeenCalledWith(components[0][0]);
      expect(deleteSpy).toHaveBeenCalledWith(components[1][0]);
    });
  });
});
