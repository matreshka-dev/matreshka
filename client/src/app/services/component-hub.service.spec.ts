import { TestBed } from '@angular/core/testing';
import { ConditionType } from '@shared/enums/condition-type';
import { ServerComponentClass } from '@shared/enums/server-component-class';
import { ContextDestroyMessage } from '@shared/messages/bff-to-client/context';
import { ContextInitMessage as BffToClientContextInitMessage } from '@shared/messages/bff-to-client/context/context-init-message';
import { ContextInitMessage as ClientToBffContextInitMessage } from '@shared/messages/client-to-bff/context/context-init-message';
import { firstValueFrom } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ServerComponent } from '../components/server/server-component';
import {
  ComponentDependencies,
  ServerComponentConfig,
} from '../components/server/server-component-config';
import { SERVER_COMPONENTS } from '../components/server/server-components-injection-token';
import { ComponentHubService } from './component-hub.service';
import { hubConfigEntry } from './component-hub/hub-test-harness';
import { ContextHubService } from './context-hub.service';
import { PostmanService } from './postman.service';
import { SsrService } from './ssr.service';
import { TestPostmanService } from './tests/test-postman.service';
import { TestSsrService } from './tests/test-ssr.service';

describe('ComponentHubService', () => {
  let service: ComponentHubService;
  let contextHub: ContextHubService;
  let postman: TestPostmanService;
  let mockServerComponents: Record<
    string,
    { dependencies: ComponentDependencies }
  >;

  // Вспомогательная функция для инициализации контекста
  async function initContext(
    contextId: string,
    values: Record<string, unknown> = {},
  ) {
    const init$ = contextHub.init$(contextId);
    // Отправляем ответ от сервера
    postman.incomingMessage$.next(
      new BffToClientContextInitMessage(contextId, values),
    );
    await firstValueFrom(init$);
  }

  beforeEach(() => {
    // Создаём моки для зависимостей компонентов
    const defaultDependencies: ComponentDependencies = {
      pathsWithPlaceholdersInTemplate: [],
      pathsWithPlaceholdersInCode: [],
      requiredContextsPaths: [],
      getNestedConfigsPaths: vi.fn(() => []),
    };

    mockServerComponents = {
      [ServerComponentClass.UnitTest]: { dependencies: defaultDependencies },
      [ServerComponentClass.TextInput]: {
        dependencies: {
          ...defaultDependencies,
          pathsWithPlaceholdersInTemplate: [],
          pathsWithPlaceholdersInCode: ['ref'],
          requiredContextsPaths: ['ref'],
          getNestedConfigsPaths: vi.fn(() => []),
        },
      },
      [ServerComponentClass.Text]: {
        dependencies: {
          ...defaultDependencies,
          pathsWithPlaceholdersInTemplate: ['link.value'],
          pathsWithPlaceholdersInCode: ['ref'],
          requiredContextsPaths: ['ref'],
          getNestedConfigsPaths: vi.fn(() => []),
        },
      },
    };

    TestBed.configureTestingModule({
      providers: [
        ComponentHubService,
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
          useValue: mockServerComponents,
        },
      ],
    });

    service = TestBed.inject(ComponentHubService);
    contextHub = TestBed.inject(ContextHubService);
    postman = TestBed.inject(PostmanService) as unknown as TestPostmanService;
  });

  describe('регистрация конфигурации', () => {
    it('должен регистрировать новую конфигурацию', () => {
      const config: ServerComponentConfig = {
        id: 'test-config-1',
        class: ServerComponentClass.UnitTest,
      };

      service.registerConfig(config);

      const retrievedConfig = service.getConfigSnapshot('test-config-1');
      expect(retrievedConfig).toBe(config);
      expect(retrievedConfig?.id).toBe('test-config-1');
      expect(service.getEntryId('test-config-1')).toBe('test-config-1');
    });

    it('должен прокидывать entryId на вложенные конфиги при регистрации дерева', () => {
      const childConfig: ServerComponentConfig = {
        id: 'nested-child',
        class: ServerComponentClass.UnitTest,
      };
      const rootConfig: ServerComponentConfig = {
        id: 'page-entry-1',
        class: ServerComponentClass.UnitTest,
        properties: { content: [childConfig] },
      };

      mockServerComponents[ServerComponentClass.UnitTest] = {
        dependencies: {
          pathsWithPlaceholdersInTemplate: [],
          pathsWithPlaceholdersInCode: [],
          requiredContextsPaths: [],
          getNestedConfigsPaths: vi.fn((config) =>
            config.id === 'page-entry-1' ? [childConfig] : [],
          ),
        },
      };

      service.registerConfig(rootConfig);

      expect(service.getEntryId('page-entry-1')).toBe('page-entry-1');
      expect(service.getEntryId('nested-child')).toBe('page-entry-1');
    });

    it('должен увеличивать счётчик использования при повторной регистрации', () => {
      const config: ServerComponentConfig = {
        id: 'test-config-2',
        class: ServerComponentClass.UnitTest,
      };

      service.registerConfig(config);
      service.registerConfig(config);
      service.registerConfig(config);

      // Проверяем, что конфиг всё ещё существует
      expect(service.getConfigSnapshot('test-config-2')).toBe(config);

      // Удаляем первый раз - конфиг должен остаться (useCount: 3 -> 2)
      service.deleteConfig(config);
      expect(service.getConfigSnapshot('test-config-2')).toBe(config);

      // Удаляем второй раз - конфиг должен остаться (useCount: 2 -> 1)
      service.deleteConfig(config);
      expect(service.getConfigSnapshot('test-config-2')).toBe(config);

      // Удаляем третий раз - теперь конфиг должен быть удалён (useCount: 1 -> 0)
      service.deleteConfig(config);
      expect(service.getConfigSnapshot('test-config-2')).toBeUndefined();
    });

    it('должен регистрировать дочерние конфигурации', () => {
      const childConfig: ServerComponentConfig = {
        id: 'child-config',
        class: ServerComponentClass.UnitTest,
      };

      const parentConfig: ServerComponentConfig = {
        id: 'parent-config',
        class: ServerComponentClass.UnitTest,
      };

      // Мокаем getNestedConfigsPaths для родителя - возвращает дочерний конфиг
      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.getNestedConfigsPaths = vi.fn((config) => {
        // Для родителя возвращаем дочерний конфиг, для дочернего - пустой массив
        if (config.id === 'parent-config') {
          return [childConfig];
        }
        return [];
      });

      service.registerConfig(parentConfig);

      expect(service.getConfigSnapshot('child-config')).toBe(childConfig);
      expect(
        mockServerComponents[ServerComponentClass.UnitTest].dependencies
          .getNestedConfigsPaths,
      ).toHaveBeenCalledWith(parentConfig);
    });
  });

  describe('deleteConfig', () => {
    it('должен удалять конфигурацию при useCount === 0', () => {
      const config: ServerComponentConfig = {
        id: 'config-to-delete',
        class: ServerComponentClass.UnitTest,
      };

      service.registerConfig(config);
      expect(service.getConfigSnapshot('config-to-delete')).toBe(config);

      service.deleteConfig(config);
      expect(service.getConfigSnapshot('config-to-delete')).toBeUndefined();
    });

    it('должен уменьшать счётчик использования и не удалять при useCount > 0', () => {
      const config: ServerComponentConfig = {
        id: 'config-multiple-use',
        class: ServerComponentClass.UnitTest,
      };

      service.registerConfig(config);
      service.registerConfig(config);

      service.deleteConfig(config);
      expect(service.getConfigSnapshot('config-multiple-use')).toBe(config);

      service.deleteConfig(config);
      expect(service.getConfigSnapshot('config-multiple-use')).toBeUndefined();
    });

    it('должен каскадно удалять дочерние конфигурации', () => {
      const childConfig: ServerComponentConfig = {
        id: 'child-to-delete',
        class: ServerComponentClass.UnitTest,
      };

      const parentConfig: ServerComponentConfig = {
        id: 'parent-to-delete',
        class: ServerComponentClass.UnitTest,
      };

      // Мокаем getNestedConfigsPaths для родителя - возвращает дочерний конфиг
      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.getNestedConfigsPaths = vi.fn((config) => {
        // Для родителя возвращаем дочерний конфиг, для дочернего - пустой массив
        if (config.id === 'parent-to-delete') {
          return [childConfig];
        }
        return [];
      });

      service.registerConfig(parentConfig);
      expect(service.getConfigSnapshot('child-to-delete')).toBe(childConfig);

      service.deleteConfig(parentConfig);
      expect(service.getConfigSnapshot('parent-to-delete')).toBeUndefined();
      expect(service.getConfigSnapshot('child-to-delete')).toBeUndefined();
    });
  });

  describe('addInstance и deleteInstance', () => {
    it('должен добавлять экземпляр компонента', () => {
      const config: ServerComponentConfig = {
        id: 'config-instances',
        class: ServerComponentClass.UnitTest,
      };

      service.registerConfig(config);

      const instance1 = {
        config,
      } as unknown as ServerComponent<ServerComponentConfig>;

      const instance2 = {
        config,
      } as unknown as ServerComponent<ServerComponentConfig>;

      const requestRerender$ = service.addInstance(
        'config-instances',
        instance1,
      );
      expect(requestRerender$).toBeDefined();
      expect(service.getInstances('config-instances')).toHaveLength(1);
      expect(service.getInstances('config-instances')[0]).toBe(instance1);

      service.addInstance('config-instances', instance2);
      expect(service.getInstances('config-instances')).toHaveLength(2);
    });

    it('должен удалять экземпляр компонента', () => {
      const config: ServerComponentConfig = {
        id: 'config-instances-delete',
        class: ServerComponentClass.UnitTest,
      };

      service.registerConfig(config);

      const instance1 = {
        config,
      } as unknown as ServerComponent<ServerComponentConfig>;

      const instance2 = {
        config,
      } as unknown as ServerComponent<ServerComponentConfig>;

      service.addInstance('config-instances-delete', instance1);
      service.addInstance('config-instances-delete', instance2);

      service.deleteInstance('config-instances-delete', instance1);
      expect(service.getInstances('config-instances-delete')).toHaveLength(1);
      expect(service.getInstances('config-instances-delete')[0]).toBe(
        instance2,
      );

      service.deleteInstance('config-instances-delete', instance2);
      expect(service.getInstances('config-instances-delete')).toHaveLength(0);
    });
  });

  describe('ready$', () => {
    it('должен возвращать observable готовности конфигурации', async () => {
      const config: ServerComponentConfig = {
        id: 'config-ready',
        class: ServerComponentClass.UnitTest,
      };

      service.registerConfig(config);

      const ready$ = service.ready$(config);
      expect(ready$).toBeDefined();

      const value = await firstValueFrom(ready$);
      expect(value).toBe(true);
    });

    it('должен возвращать тот же observable при повторном вызове', () => {
      const config: ServerComponentConfig = {
        id: 'config-ready-same',
        class: ServerComponentClass.UnitTest,
      };

      service.registerConfig(config);

      const ready$1 = service.ready$(config);
      const ready$2 = service.ready$(config);

      expect(ready$1).toBe(ready$2);
    });

    it('должен выбрасывать ошибку если конфиг не найден', () => {
      const config: ServerComponentConfig = {
        id: 'non-existent-config',
        class: ServerComponentClass.UnitTest,
      };

      expect(() => service.ready$(config)).toThrow(
        'Component config not found: non-existent-config',
      );
    });
  });

  describe('реакция на изменения контекста', () => {
    it('должен вызывать ререндер при изменении зависимого контекста из шаблона', async () => {
      const config: ServerComponentConfig = {
        id: 'config-context-change',
        class: ServerComponentClass.UnitTest,
      };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.pathsWithPlaceholdersInTemplate = ['title'];

      const configWithPlaceholder: {
        properties: { title: string };
      } & ServerComponentConfig = {
        ...config,
        properties: { title: '@{ctx1.field}' },
      };

      // Инициализируем контекст перед регистрацией конфига
      await initContext('ctx1', { field: 'initial' });

      service.registerConfig(configWithPlaceholder);
      const mockInstance = {
        config: configWithPlaceholder,
      } as unknown as ServerComponent<ServerComponentConfig>;

      service.addInstance('config-context-change', mockInstance);

      let rerenderCalled = false;
      const requestRerender$ = service.addInstance(
        'config-context-change',
        mockInstance,
      );
      requestRerender$.subscribe(() => {
        rerenderCalled = true;
      });

      // Эмулируем изменение контекста через реальный сервис
      contextHub.setValues('ctx1', [{ key: 'field', value: 'new' }]);

      // Даём время на асинхронную обработку
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(rerenderCalled).toBe(true);
    });
  });

  describe('getConfig и getInstances', () => {
    it('должен возвращать undefined для несуществующего конфига', () => {
      expect(service.getConfigSnapshot('non-existent')).toBeUndefined();
    });

    it('должен возвращать пустой массив для несуществующих экземпляров', () => {
      expect(service.getInstances('non-existent')).toEqual([]);
    });
  });

  describe('рекурсивная загрузка контекстов', () => {
    it('должен загружать новые контексты, появившиеся после инициализации', async () => {
      const config: { properties: { title: string } } & ServerComponentConfig =
        {
          id: 'config-recursive-contexts',
          class: ServerComponentClass.UnitTest,
          properties: { title: '@{ctx1.field}' },
        };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.pathsWithPlaceholdersInTemplate = ['title'];

      // Эмулируем ответы сервера только когда сервис запросит инициализацию контекстов
      const sub = postman.outcomingMessage$.subscribe((message) => {
        if (message instanceof ClientToBffContextInitMessage) {
          if (message.target === 'ctx1') {
            // ctx1 содержит плейсхолдер на второй контекст
            postman.incomingMessage$.next(
              new BffToClientContextInitMessage('ctx1', {
                field: '@{ctx2.nested}',
              }),
            );
          }
          if (message.target === 'ctx2') {
            postman.incomingMessage$.next(
              new BffToClientContextInitMessage('ctx2', {
                nested: 'final-value',
              }),
            );
          }
        }
      });

      service.registerConfig(config);

      const value = await firstValueFrom(service.ready$(config));
      expect(value).toBe(true);

      // Проверяем, что оба контекста были загружены именно в результате работы ready$
      expect(contextHub.loaded('ctx1')).toBe(true);
      expect(contextHub.loaded('ctx2')).toBe(true);

      sub.unsubscribe();
    });
  });

  describe('разные типы совпадений ключей в реакции на изменения контекста', () => {
    it('должен вызывать ререндер при точном совпадении ключа', async () => {
      const config: ServerComponentConfig = {
        id: 'config-exact-match',
        class: ServerComponentClass.UnitTest,
      };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.pathsWithPlaceholdersInTemplate = ['field'];

      const configWithPlaceholder: {
        properties: { field: string };
      } & ServerComponentConfig = {
        ...config,
        properties: { field: '@{ctx1.exactKey}' },
      };

      await initContext('ctx1', { exactKey: 'value' });
      service.registerConfig(configWithPlaceholder);

      const mockInstance = {
        config: configWithPlaceholder,
      } as unknown as ServerComponent<ServerComponentConfig>;

      let rerenderCalled = false;
      const requestRerender$ = service.addInstance(
        'config-exact-match',
        mockInstance,
      );
      requestRerender$.subscribe(() => {
        rerenderCalled = true;
      });

      // Изменяем точно тот же ключ
      contextHub.setValues('ctx1', [{ key: 'exactKey', value: 'new' }]);

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(rerenderCalled).toBe(true);
    });

    it('должен вызывать ререндер при совпадении через startsWith', async () => {
      const config: ServerComponentConfig = {
        id: 'config-starts-with',
        class: ServerComponentClass.UnitTest,
      };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.pathsWithPlaceholdersInTemplate = ['field'];

      const configWithPlaceholder: {
        properties: { field: string };
      } & ServerComponentConfig = {
        ...config,
        properties: { field: '@{ctx1.nested.key}' },
      };

      await initContext('ctx1', { 'nested.key': 'value' });
      service.registerConfig(configWithPlaceholder);

      const mockInstance = {
        config: configWithPlaceholder,
      } as unknown as ServerComponent<ServerComponentConfig>;

      let rerenderCalled = false;
      const requestRerender$ = service.addInstance(
        'config-starts-with',
        mockInstance,
      );
      requestRerender$.subscribe(() => {
        rerenderCalled = true;
      });

      // Изменяем родительский ключ (nested)
      contextHub.setValues('ctx1', [{ key: 'nested', value: 'new' }]);

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(rerenderCalled).toBe(true);
    });

    it('должен вызывать ререндер при совпадении, когда меняется дочерний ключ', async () => {
      const config: ServerComponentConfig = {
        id: 'config-child-key-changed',
        class: ServerComponentClass.UnitTest,
      };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.pathsWithPlaceholdersInTemplate = ['field'];

      const configWithPlaceholder: {
        properties: { field: string };
      } & ServerComponentConfig = {
        ...config,
        // preparedKey = "nested"
        properties: { field: '@{ctx1.nested}' },
      };

      await initContext('ctx1', { nested: { key: 'value' } });
      service.registerConfig(configWithPlaceholder);

      const mockInstance = {
        config: configWithPlaceholder,
      } as unknown as ServerComponent<ServerComponentConfig>;

      let rerenderCalled = false;
      const requestRerender$ = service.addInstance(
        'config-child-key-changed',
        mockInstance,
      );
      requestRerender$.subscribe(() => {
        rerenderCalled = true;
      });

      // Изменяем дочерний ключ (nested.key начинается с nested)
      // Логика: preparedKey = "nested", v.key = "nested.key", проверяется v.key.startsWith(preparedKey)
      contextHub.setValues('ctx1', [{ key: 'nested.key', value: 'new' }]);

      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(rerenderCalled).toBe(true);
    });
  });

  describe('поведение ready$ при rerender$', () => {
    it('должен повторно эмитить готовность при ререндере без пересоздания ready$', async () => {
      const config: { properties: { title: string } } & ServerComponentConfig =
        {
          id: 'config-rerender-ready',
          class: ServerComponentClass.UnitTest,
          properties: { title: '@{ctx1.title}' },
        };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.pathsWithPlaceholdersInTemplate = ['title'];

      service.registerConfig(config);
      await initContext('ctx1', { title: 'old' });

      const ready$1 = service.ready$(config);
      await firstValueFrom(ready$1);

      // Вызываем ререндер через изменение контекста
      contextHub.setValues('ctx1', [{ key: 'title', value: 'new' }]);

      // Даём время на обработку
      await new Promise((resolve) => setTimeout(resolve, 50));

      // ready$ не должен пересоздаваться, чтобы не «ронять» активные подписки,
      // но при этом после ререндера он должен снова эмитить готовность.
      const ready$2 = service.ready$(config);
      expect(ready$2).toBeDefined();
      // Объект observable переиспользуется
      expect(ready$2).toBe(ready$1);
      // И он должен снова эмитить true
      const value = await firstValueFrom(ready$2);
      expect(value).toBe(true);
    });
  });

  describe('обработка pathsWithPlaceholdersInCode', () => {
    it('должен вычислять зависимости из pathsWithPlaceholdersInCode', () => {
      const config: { properties: { ref: string } } & ServerComponentConfig = {
        id: 'config-code-placeholders',
        class: ServerComponentClass.UnitTest,
        properties: { ref: '@{ctx1.codeField}' },
      };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.pathsWithPlaceholdersInCode = ['ref'];

      const initSpy = vi.spyOn(contextHub, 'init$');

      service.registerConfig(config);

      // Вызов ready$ с подпиской должен инициировать загрузку контекста,
      // извлечённого из pathsWithPlaceholdersInCode.
      const sub = service.ready$(config).subscribe();

      expect(initSpy).toHaveBeenCalledWith('ctx1');

      sub.unsubscribe();
    });
  });

  describe('несколько компонентов, зависящих от одного контекста', () => {
    it('должен уведомлять все компоненты об изменении контекста', async () => {
      const config1: ServerComponentConfig = {
        id: 'config-multi-1',
        class: ServerComponentClass.UnitTest,
      };

      const config2: ServerComponentConfig = {
        id: 'config-multi-2',
        class: ServerComponentClass.UnitTest,
      };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.pathsWithPlaceholdersInTemplate = ['field1', 'field2'];

      const configWithPlaceholder1: {
        properties: { field1: string };
      } & ServerComponentConfig = {
        ...config1,
        properties: { field1: '@{ctx1.shared}' },
      };

      const configWithPlaceholder2: {
        properties: { field2: string };
      } & ServerComponentConfig = {
        ...config2,
        properties: { field2: '@{ctx1.shared}' },
      };

      await initContext('ctx1', { shared: 'initial' });

      service.registerConfig(configWithPlaceholder1);
      service.registerConfig(configWithPlaceholder2);

      const instance1 = {
        config: configWithPlaceholder1,
      } as unknown as ServerComponent<ServerComponentConfig>;

      const instance2 = {
        config: configWithPlaceholder2,
      } as unknown as ServerComponent<ServerComponentConfig>;

      let rerender1Called = false;
      let rerender2Called = false;

      const requestRerender$1 = service.addInstance(
        'config-multi-1',
        instance1,
      );
      const requestRerender$2 = service.addInstance(
        'config-multi-2',
        instance2,
      );

      requestRerender$1.subscribe(() => {
        rerender1Called = true;
      });

      requestRerender$2.subscribe(() => {
        rerender2Called = true;
      });

      // Изменяем общий контекст
      contextHub.setValues('ctx1', [{ key: 'shared', value: 'new' }]);

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(rerender1Called).toBe(true);
      expect(rerender2Called).toBe(true);
    });
  });

  describe('обработка deleteConfig для несуществующего конфига', () => {
    it('должен работать без ошибок при удалении несуществующего конфига', () => {
      const config: ServerComponentConfig = {
        id: 'non-existent-config',
        class: ServerComponentClass.UnitTest,
      };

      // Не должно быть ошибки
      expect(() => service.deleteConfig(config)).not.toThrow();
    });
  });

  describe('обработка addInstance для несуществующего конфига', () => {
    it('должен выбрасывать ошибку при добавлении экземпляра для несуществующего конфига', () => {
      const config: ServerComponentConfig = {
        id: 'non-existent-config',
        class: ServerComponentClass.UnitTest,
      };

      const instance = {
        config,
      } as ServerComponent<ServerComponentConfig>;

      expect(() =>
        service.addInstance('non-existent-config', instance),
      ).toThrow();
    });
  });

  describe('обработка нешаблонных зависимостей контекста', () => {
    it('не должен вызывать ререндер для нешаблонных зависимостей', async () => {
      const config: ServerComponentConfig = {
        id: 'config-non-template',
        class: ServerComponentClass.UnitTest,
      };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.pathsWithPlaceholdersInCode = ['field'];

      const configWithPlaceholder: {
        properties: { field: string };
      } & ServerComponentConfig = {
        ...config,
        properties: { field: '@{ctx1.field}' },
      };

      await initContext('ctx1', { field: 'initial' });
      service.registerConfig(configWithPlaceholder);

      const mockInstance = {
        config: configWithPlaceholder,
      } as unknown as ServerComponent<ServerComponentConfig>;

      let rerenderCalled = false;
      const requestRerender$ = service.addInstance(
        'config-non-template',
        mockInstance,
      );
      requestRerender$.subscribe(() => {
        rerenderCalled = true;
      });

      // Изменяем контекст
      contextHub.setValues('ctx1', [{ key: 'field', value: 'new' }]);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Ререндер не должен быть вызван для нешаблонных зависимостей
      expect(rerenderCalled).toBe(false);
    });
  });

  describe('обработка случая, когда контекст не загружен при вычислении зависимостей', () => {
    it('должен корректно вычислять зависимости даже если контекст не загружен', () => {
      const config: { properties: { title: string } } & ServerComponentConfig =
        {
          id: 'config-unloaded-context',
          class: ServerComponentClass.UnitTest,
          properties: { title: '@{ctx1.field}' },
        };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.pathsWithPlaceholdersInTemplate = ['title'];

      // Не инициализируем контекст
      expect(contextHub.loaded('ctx1')).toBe(false);

      service.registerConfig(config);

      // Зависимости должны быть вычислены даже без загруженного контекста
      const ready$ = service.ready$(config);
      expect(ready$).toBeDefined();

      const entry = hubConfigEntry(service, 'config-unloaded-context');
      expect(entry).toBeDefined();

      const deps = entry.contextDependencies.get('title');
      expect(deps).toBeDefined();
      expect(deps).toHaveLength(1);
      expect(deps[0]).toEqual({
        contextId: 'ctx1',
        key: 'field',
        rerender: true,
      });
    });
  });

  describe('обработка случая с несколькими плейсхолдерами в одном поле', () => {
    it('должен обрабатывать несколько плейсхолдеров в одном значении', async () => {
      const config: {
        properties: { title: string };
      } & ServerComponentConfig = {
        id: 'config-multiple-placeholders',
        class: ServerComponentClass.UnitTest,
        properties: {
          title: 'Hello @{ctx1.name}, your balance is @{ctx2.balance}',
        },
      };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.pathsWithPlaceholdersInTemplate = ['title'];

      await initContext('ctx1', { name: 'John' });
      await initContext('ctx2', { balance: '100' });

      service.registerConfig(config);

      // Вызов ready$ с подпиской инициирует проверку зависимостей,
      // но нас здесь интересует именно то, что обе зависимости были найдены.
      const sub = service.ready$(config).subscribe();

      const entry = hubConfigEntry(service, 'config-multiple-placeholders');
      expect(entry).toBeDefined();

      const deps = entry.contextDependencies.get('title');
      expect(deps).toBeDefined();
      expect(deps).toHaveLength(2);

      // Проверяем, что оба контекста и их ключи попали в зависимости
      expect(deps).toEqual(
        expect.arrayContaining([
          { contextId: 'ctx1', key: 'name', rerender: true },
          { contextId: 'ctx2', key: 'balance', rerender: true },
        ]),
      );

      sub.unsubscribe();
    });
  });

  describe('обработка случая с условиями без payload', () => {
    it('должен корректно обрабатывать условия без payload', () => {
      const config: ServerComponentConfig = {
        id: 'config-no-payload-condition',
        class: ServerComponentClass.UnitTest,
        conditions: [
          {
            type: ConditionType.MobileDevice,
          },
        ],
      };

      service.registerConfig(config);

      const ready$ = service.ready$(config);
      expect(ready$).toBeDefined();
    });
  });

  describe('обработка случая с requiredContextsPaths без значения', () => {
    it('должен корректно обрабатывать requiredContextsPaths когда значение не строка', () => {
      const config: {
        properties: { contextId: number };
      } & ServerComponentConfig = {
        id: 'config-non-string-required',
        class: ServerComponentClass.UnitTest,
        properties: { contextId: 123 },
      };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.requiredContextsPaths = ['properties.contextId'];

      service.registerConfig(config);

      const ready$ = service.ready$(config);
      expect(ready$).toBeDefined();
    });
  });

  describe('критические edge cases', () => {
    it('должен обрабатывать множественные вложенные конфиги (дедушка-отец-сын)', () => {
      const grandchildConfig: ServerComponentConfig = {
        id: 'grandchild-config',
        class: ServerComponentClass.UnitTest,
      };

      const childConfig: ServerComponentConfig = {
        id: 'child-config',
        class: ServerComponentClass.UnitTest,
      };

      const parentConfig: ServerComponentConfig = {
        id: 'parent-config',
        class: ServerComponentClass.UnitTest,
      };

      // Мокаем getNestedConfigsPaths для создания иерархии
      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.getNestedConfigsPaths = vi.fn((config) => {
        if (config.id === 'parent-config') {
          return [childConfig];
        }
        if (config.id === 'child-config') {
          return [grandchildConfig];
        }
        return [];
      });

      service.registerConfig(parentConfig);

      // Все конфиги должны быть зарегистрированы
      expect(service.getConfigSnapshot('parent-config')).toBe(parentConfig);
      expect(service.getConfigSnapshot('child-config')).toBe(childConfig);
      expect(service.getConfigSnapshot('grandchild-config')).toBe(
        grandchildConfig,
      );

      // При удалении родителя должны удалиться все дочерние
      service.deleteConfig(parentConfig);
      expect(service.getConfigSnapshot('parent-config')).toBeUndefined();
      expect(service.getConfigSnapshot('child-config')).toBeUndefined();
      expect(service.getConfigSnapshot('grandchild-config')).toBeUndefined();
    });

    it('должен обрабатывать случай с множественными экземплярами при ререндере', async () => {
      const config: ServerComponentConfig = {
        id: 'config-multiple-instances-rerender',
        class: ServerComponentClass.UnitTest,
      };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.pathsWithPlaceholdersInTemplate = ['field'];

      const configWithPlaceholder: {
        properties: { field: string };
      } & ServerComponentConfig = {
        ...config,
        properties: { field: '@{ctx1.field}' },
      };

      await initContext('ctx1', { field: 'initial' });
      service.registerConfig(configWithPlaceholder);

      const instance1 = {
        config: configWithPlaceholder,
      } as unknown as ServerComponent<ServerComponentConfig>;

      const instance2 = {
        config: configWithPlaceholder,
      } as unknown as ServerComponent<ServerComponentConfig>;

      const instance3 = {
        config: configWithPlaceholder,
      } as unknown as ServerComponent<ServerComponentConfig>;

      let rerender1Called = false;
      let rerender2Called = false;
      let rerender3Called = false;

      const requestRerender$1 = service.addInstance(
        'config-multiple-instances-rerender',
        instance1,
      );
      const requestRerender$2 = service.addInstance(
        'config-multiple-instances-rerender',
        instance2,
      );
      const requestRerender$3 = service.addInstance(
        'config-multiple-instances-rerender',
        instance3,
      );

      requestRerender$1.subscribe(() => {
        rerender1Called = true;
      });
      requestRerender$2.subscribe(() => {
        rerender2Called = true;
      });
      requestRerender$3.subscribe(() => {
        rerender3Called = true;
      });

      // Изменяем контекст
      contextHub.setValues('ctx1', [{ key: 'field', value: 'new' }]);

      await new Promise((resolve) => setTimeout(resolve, 100));

      // Все экземпляры должны получить уведомление
      expect(rerender1Called).toBe(true);
      expect(rerender2Called).toBe(true);
      expect(rerender3Called).toBe(true);
    });

    it('должен обрабатывать случай с deleteInstance для несуществующего экземпляра', () => {
      const config: ServerComponentConfig = {
        id: 'config-delete-non-existent-instance',
        class: ServerComponentClass.UnitTest,
      };

      service.registerConfig(config);

      const instance1 = {
        config,
      } as unknown as ServerComponent<ServerComponentConfig>;

      const instance2 = {
        config,
      } as unknown as ServerComponent<ServerComponentConfig>;

      service.addInstance('config-delete-non-existent-instance', instance1);

      // Удаляем экземпляр, который не был добавлен
      expect(() =>
        service.deleteInstance(
          'config-delete-non-existent-instance',
          instance2,
        ),
      ).not.toThrow();

      // Первый экземпляр должен остаться
      expect(
        service.getInstances('config-delete-non-existent-instance'),
      ).toHaveLength(1);
    });
  });

  describe('freezeConfigSubtree / unfreezeConfigSubtree', () => {
    it('должен эмитить freezeConfig$ для конфига и вложенных', () => {
      const childConfig: ServerComponentConfig = {
        id: 'child-config',
        class: ServerComponentClass.UnitTest,
      };
      const parentConfig: ServerComponentConfig = {
        id: 'parent-config',
        class: ServerComponentClass.UnitTest,
      };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.getNestedConfigsPaths = vi.fn(
        (config: ServerComponentConfig) =>
          config.id === 'parent-config' ? [childConfig] : [],
      );

      service.registerConfig(parentConfig);

      const frozenIds: string[] = [];
      service.freezeConfig$.subscribe((id) => frozenIds.push(id));

      service.freezeConfigSubtree(parentConfig);

      expect(frozenIds).toEqual(['parent-config', 'child-config']);
      expect(service.isConfigFrozen('parent-config')).toBe(true);
      expect(service.isConfigFrozen('child-config')).toBe(true);
    });

    it('должен эмитить unfreezeConfig$ и снимать заморозку', () => {
      const config: ServerComponentConfig = {
        id: 'frozen-config',
        class: ServerComponentClass.UnitTest,
      };

      service.registerConfig(config);
      service.freezeConfigSubtree(config);

      const unfrozenIds: string[] = [];
      service.unfreezeConfig$.subscribe((id) => unfrozenIds.push(id));

      service.unfreezeConfigSubtree(config);

      expect(unfrozenIds).toEqual(['frozen-config']);
      expect(service.isConfigFrozen('frozen-config')).toBe(false);
    });

    it('должен очищать заморозку при deleteConfig', () => {
      const config: ServerComponentConfig = {
        id: 'delete-frozen-config',
        class: ServerComponentClass.UnitTest,
      };

      service.registerConfig(config);
      service.freezeConfigSubtree(config);
      service.deleteConfig(config);

      expect(service.isConfigFrozen('delete-frozen-config')).toBe(false);
    });

    it('должен пересчитывать rules при разморозке, если данные пришли пока узел был заморожен', async () => {
      await initContext('ctx1', { enabled: false });

      const config: { properties: { title: string } } & ServerComponentConfig =
        {
          id: 'frozen-rules-config',
          class: ServerComponentClass.UnitTest,
          properties: {
            title: 'default',
          },
          rules: [
            {
              conditions: [
                {
                  type: ConditionType.ContextValueEqual,
                  payload: {
                    ref: 'ctx1.enabled',
                    value: { kind: 'literal', value: true },
                  },
                },
              ],
              overrides: {
                title: 'enabled',
              },
            },
          ],
        };

      service.registerConfig(config);
      await firstValueFrom(service.ready$(config));
      expect(config.properties.title).toBe('default');

      service.freezeConfigSubtree(config);
      contextHub.setValues('ctx1', [{ key: 'enabled', value: true }]);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(config.properties.title).toBe('default');

      service.unfreezeConfigSubtree(config);

      expect(config.properties.title).toBe('enabled');
    });
  });

  describe('entry destroy state', () => {
    it('включает и выключает флаг destroy', () => {
      expect(service.isEntryDestroyActive()).toBe(false);

      service.beginEntryDestroy('page-root');
      expect(service.isEntryDestroyActive()).toBe(true);

      service.endEntryDestroy('page-root');
      expect(service.isEntryDestroyActive()).toBe(false);
    });

    it('поддерживает вложенные begin/end для одного root id', () => {
      service.beginEntryDestroy('dialog-root');
      service.beginEntryDestroy('dialog-root');

      expect(service.isEntryDestroyActive()).toBe(true);

      service.endEntryDestroy('dialog-root');
      expect(service.isEntryDestroyActive()).toBe(true);

      service.endEntryDestroy('dialog-root');
      expect(service.isEntryDestroyActive()).toBe(false);
    });

    it('поддерживает перекрывающиеся destroy для разных root id', () => {
      service.beginEntryDestroy('page-root');
      service.beginEntryDestroy('dialog-root');

      expect(service.isEntryDestroyActive()).toBe(true);

      service.endEntryDestroy('page-root');
      expect(service.isEntryDestroyActive()).toBe(true);

      service.endEntryDestroy('dialog-root');
      expect(service.isEntryDestroyActive()).toBe(false);
    });
  });

  describe('entryDestroy$', () => {
    it('destroyEntry завершает поток entryDestroy$', () => {
      const events: unknown[] = [];
      service
        .entryDestroy$('page-root')
        .subscribe(() => events.push(undefined));

      service.destroyEntry('page-root');

      expect(events).toHaveLength(1);
      expect(service.isEntryDestroyed('page-root')).toBe(true);
    });

    it('entryDestroy$ сразу завершается для уже уничтоженного entry', () => {
      service.destroyEntry('page-root');

      let completed = false;
      service.entryDestroy$('page-root').subscribe({
        complete: () => {
          completed = true;
        },
      });

      expect(completed).toBe(true);
    });

    it('deleteConfig корня сбрасывает destroyed-состояние entry', () => {
      const config: ServerComponentConfig = {
        id: 'page-root',
        class: ServerComponentClass.UnitTest,
      };

      service.registerConfig(config);
      service.destroyEntry('page-root');
      expect(service.isEntryDestroyed('page-root')).toBe(true);

      service.deleteConfig(config);
      expect(service.isEntryDestroyed('page-root')).toBe(false);
    });

    it('destroyActivePageEntry отписывает текущую страницу', () => {
      const events: unknown[] = [];
      service.setActivePageEntryId('page-root');
      service
        .entryDestroy$('page-root')
        .subscribe(() => events.push(undefined));

      service.destroyActivePageEntry();

      expect(events).toHaveLength(1);
      expect(service.isEntryDestroyed('page-root')).toBe(true);
    });
  });

  describe('animateSubtree', () => {
    it('должен запускать hide у корня и вложенных конфигов с onHide', async () => {
      const hidePayload = {
        class: 'animate-component' as const,
        payload: { duration: 300, effects: {} },
      };
      const childConfig: ServerComponentConfig = {
        id: 'child-hide',
        class: ServerComponentClass.UnitTest,
        interactions: { hide: [hidePayload] },
      };
      const parentConfig: ServerComponentConfig = {
        id: 'parent-hide',
        class: ServerComponentClass.UnitTest,
        interactions: { hide: [hidePayload] },
      };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.getNestedConfigsPaths = vi.fn(
        (config: ServerComponentConfig) =>
          config.id === 'parent-hide' ? [childConfig] : [],
      );

      service.registerConfig(parentConfig);

      const parentInstance = {
        animateInteraction: vi.fn(() => Promise.resolve([])),
      } as unknown as ServerComponent<ServerComponentConfig>;
      const childInstance = {
        animateInteraction: vi.fn(() => Promise.resolve([])),
      } as unknown as ServerComponent<ServerComponentConfig>;

      service.addInstance('parent-hide', parentInstance);
      service.addInstance('child-hide', childInstance);

      await service.animateSubtree('parent-hide', 'hide');

      expect(parentInstance.animateInteraction).toHaveBeenCalledWith('hide');
      expect(childInstance.animateInteraction).toHaveBeenCalledWith('hide');
    });

    it('должен пропускать конфиги без onHide', async () => {
      const parentConfig: ServerComponentConfig = {
        id: 'parent-no-hide',
        class: ServerComponentClass.UnitTest,
      };
      service.registerConfig(parentConfig);

      const parentInstance = {
        animateInteraction: vi.fn(() => Promise.resolve([])),
      } as unknown as ServerComponent<ServerComponentConfig>;
      service.addInstance('parent-no-hide', parentInstance);

      await service.animateSubtree('parent-no-hide', 'hide');

      expect(parentInstance.animateInteraction).not.toHaveBeenCalled();
    });

    it('может пропускать root и запускать hide только у вложенных конфигов', async () => {
      const hidePayload = {
        class: 'animate-component' as const,
        payload: { duration: 300, effects: {} },
      };
      const childConfig: ServerComponentConfig = {
        id: 'child-only-hide',
        class: ServerComponentClass.UnitTest,
        interactions: { hide: [hidePayload] },
      };
      const parentConfig: ServerComponentConfig = {
        id: 'parent-skip-root-hide',
        class: ServerComponentClass.UnitTest,
        interactions: { hide: [hidePayload] },
      };

      mockServerComponents[
        ServerComponentClass.UnitTest
      ].dependencies.getNestedConfigsPaths = vi.fn(
        (config: ServerComponentConfig) =>
          config.id === 'parent-skip-root-hide' ? [childConfig] : [],
      );

      service.registerConfig(parentConfig);

      const parentInstance = {
        animateInteraction: vi.fn(() => Promise.resolve([])),
      } as unknown as ServerComponent<ServerComponentConfig>;
      const childInstance = {
        animateInteraction: vi.fn(() => Promise.resolve([])),
      } as unknown as ServerComponent<ServerComponentConfig>;

      service.addInstance('parent-skip-root-hide', parentInstance);
      service.addInstance('child-only-hide', childInstance);

      await service.animateSubtree('parent-skip-root-hide', 'hide', {
        skipRoot: true,
      });

      expect(parentInstance.animateInteraction).not.toHaveBeenCalled();
      expect(childInstance.animateInteraction).toHaveBeenCalledWith('hide');
    });
  });

  describe('отложенное уничтожение контекста (holds)', () => {
    it('snapshot до deleteConfig после context-destroy', async () => {
      const config: ServerComponentConfig = {
        id: 'page-with-ctx',
        class: ServerComponentClass.Text,
        properties: {
          ref: 'ctx-page.title',
          text: '',
        },
      };

      await initContext('ctx-page', { title: 'hello' });
      await initContext('ctx-other', { n: 0 });

      service.registerConfig(config, 'page-root');
      expect(contextHub.holdCount('ctx-page')).toBeGreaterThan(0);

      postman.incomingMessage$.next(new ContextDestroyMessage('ctx-page'));

      expect(contextHub.loaded('ctx-page')).toBe(true);
      expect(contextHub.isPendingDestroy('ctx-page')).toBe(true);

      contextHub.setValues('ctx-other', [{ key: 'n', value: 1 }]);
      expect(contextHub.value('ctx-page.title')).toBe('hello');

      service.deleteConfig(config);
      expect(contextHub.loaded('ctx-page')).toBe(false);
    });
  });
});
