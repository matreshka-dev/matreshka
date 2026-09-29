import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerComponentClass } from '@shared/enums/server-component-class';
import {
  ContextInitMessage as BffContextInitMessage,
  ContextValuesMessage as BffContextValuesMessage,
} from '@shared/messages/bff-to-client/context';
import type { OutputConfig } from '@shared/types/output-config';
import { PreparePipe } from '../../../pipes/prepare.pipe';
import { PLATFORM } from '../../../platforms/platform';
import { TestPlatform } from '../../../platforms/tests/test-platform';
import { ComponentHubService } from '../../../services/component-hub.service';
import { ContextHubService } from '../../../services/context-hub.service';
import { EnvironmentService } from '../../../services/environment.service';
import { PostmanService } from '../../../services/postman.service';
import { SsrService } from '../../../services/ssr.service';
import { TestPostmanService } from '../../../services/tests/test-postman.service';
import { TestSsrService } from '../../../services/tests/test-ssr.service';
import { SERVER_COMPONENTS } from '../server-components-injection-token';
import { ServerOutputComponent } from './server-output-component';
import { TextOutputDependencies } from './text-output/text-output-config';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
class TestServerOutputComponent extends ServerOutputComponent<
  OutputConfig<string>,
  string
> {
  override default(): string {
    return 'default-value';
  }
}

describe('ServerOutputComponent', () => {
  let componentHub: ComponentHubService;
  let contextHub: ContextHubService;
  let postman: TestPostmanService;
  const fixtures: ComponentFixture<TestServerOutputComponent>[] = [];
  const configs: OutputConfig<string>[] = [];

  const configId = 'output-test-id';
  let config: OutputConfig<string>;

  function createOutputComponent(currentConfig: OutputConfig<string>) {
    componentHub.registerConfig(currentConfig);
    configs.push(currentConfig);

    const currentFixture = TestBed.createComponent(TestServerOutputComponent);
    currentFixture.componentRef.setInput('id', currentConfig.id);
    const currentComponent = currentFixture.componentInstance;
    (
      currentComponent as unknown as {
        _configSignal: { set(value: OutputConfig<string>): void };
      }
    )._configSignal.set(currentConfig);
    currentFixture.detectChanges();
    fixtures.push(currentFixture);

    return { fixture: currentFixture, component: currentComponent };
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestServerOutputComponent],
      providers: [
        ComponentHubService,
        EnvironmentService,
        {
          provide: PostmanService,
          useClass: TestPostmanService,
        },
        ContextHubService,
        {
          provide: SsrService,
          useClass: TestSsrService,
        },
        {
          provide: SERVER_COMPONENTS,
          useValue: {
            [ServerComponentClass.UnitTestOutput]: {
              component: TestServerOutputComponent,
              dependencies: TextOutputDependencies,
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
      class: ServerComponentClass.UnitTestOutput,
      properties: {},
    } as OutputConfig<string>;
  });

  afterEach(() => {
    while (fixtures.length) {
      fixtures.pop()!.destroy();
    }
    while (configs.length) {
      const currentConfig = configs.pop()!;
      if (componentHub.getConfigSnapshot(currentConfig.id)) {
        componentHub.deleteConfig(currentConfig);
      }
    }
  });

  describe('инициализация и обновление через properties.key (ContextHub)', () => {
    const contextId = 'ctx-output';

    it('должен инициализировать value из контекста по ключу', () => {
      // Инициализируем контекст и отправляем начальные значения
      contextHub.init$(contextId).subscribe();
      postman.incomingMessage$.next(
        new BffContextInitMessage(contextId, {
          field: 'initial-from-context',
        }),
      );

      config.properties.ref = `${contextId}.field`;
      const { component } = createOutputComponent(config);

      expect(component.value()).toBe('initial-from-context');
    });

    it('должен использовать default(), если значение в контексте отсутствует', () => {
      contextHub.init$(contextId).subscribe();
      postman.incomingMessage$.next(
        new BffContextInitMessage(contextId, {
          other: 'value',
        }),
      );

      config.properties.ref = `${contextId}.missing`;
      const { component } = createOutputComponent(config);

      expect(component.value()).toBe('default-value');
    });

    it('должен обновлять value при изменении контекста', () => {
      contextHub.init$(contextId).subscribe();
      postman.incomingMessage$.next(
        new BffContextInitMessage(contextId, {
          field: 'from-context',
        }),
      );

      config.properties.ref = `${contextId}.field`;
      const { component } = createOutputComponent(config);

      expect(component.value()).toBe('from-context');

      // Обновляем значение контекста — это должно обновить signal value
      postman.incomingMessage$.next(
        new BffContextValuesMessage(contextId, [
          { key: 'field', value: 'updated-from-context' },
        ]),
      );

      expect(component.value()).toBe('updated-from-context');
    });

    it('не обновляет value из контекста, пока конфиг заморожен', () => {
      contextHub.init$(contextId).subscribe();
      postman.incomingMessage$.next(
        new BffContextInitMessage(contextId, {
          field: 'initial-title',
        }),
      );

      config.properties.ref = `${contextId}.field`;
      const { component } = createOutputComponent(config);

      componentHub.freezeConfigSubtree(config);

      postman.incomingMessage$.next(
        new BffContextValuesMessage(contextId, [
          { key: 'field', value: 'other-title' },
        ]),
      );

      expect(component.value()).toBe('initial-title');
      expect(
        (
          component as unknown as { contextFrozen: () => boolean }
        ).contextFrozen(),
      ).toBe(true);

      componentHub.unfreezeConfigSubtree(config);

      expect(
        (
          component as unknown as { contextFrozen: () => boolean }
        ).contextFrozen(),
      ).toBe(false);
      expect(component.value()).toBe('initial-title');

      postman.incomingMessage$.next(
        new BffContextValuesMessage(contextId, [
          { key: 'field', value: 'after-unfreeze' },
        ]),
      );

      expect(component.value()).toBe('after-unfreeze');
    });
  });

  describe('плейсхолдеры в значении и ключе', () => {
    it('value: должен подставлять значения из контекста через pipe и запрашивать ререндер при их изменении', () => {
      const contextId = 'ctx-output-placeholder';
      // Инициализируем контекст и отправляем начальные значения
      contextHub.init$(contextId).subscribe();
      postman.incomingMessage$.next(
        new BffContextInitMessage(contextId, {
          name: 'initial-name',
        }),
      );

      const placeholderConfigId = 'output-placeholder-value';
      const placeholderConfig: OutputConfig<string> = {
        id: placeholderConfigId,
        class: ServerComponentClass.UnitTestOutput,
        properties: {
          value: 'Hello @{ctx-output-placeholder.name}!',
        },
      };

      const { component: placeholderComponent } =
        createOutputComponent(placeholderConfig);

      // Подготовка spy до ngOnInit, затем очистим первоначальные вызовы
      const markForCheckSpy = vi.spyOn(
        placeholderComponent.cdr,
        'markForCheck',
      );

      markForCheckSpy.mockClear();

      const preparePipe = TestBed.runInInjectionContext(
        () => new PreparePipe(),
      );

      // Проверяем начальное значение после подстановки плейсхолдера
      expect(preparePipe.transform(placeholderComponent.value())).toBe(
        'Hello initial-name!',
      );

      // Изменяем значение в контексте — это должно вызвать запрос ререндера
      postman.incomingMessage$.next(
        new BffContextValuesMessage(contextId, [
          { key: 'name', value: 'updated-name' },
        ]),
      );

      // Проверяем, что был запрос ререндера (markForCheck) и значение изменилось
      expect(markForCheckSpy).toHaveBeenCalledTimes(1);
      expect(preparePipe.transform(placeholderComponent.value())).toBe(
        'Hello updated-name!',
      );
    });

    it('key: должен подставлять значения из плейсхолдера в ключе и обновлять value при изменении контекста', () => {
      const metaContextId = 'meta';
      const usersContextId = 'users';

      // Инициализируем meta-контекст с текущим идентификатором пользователя
      contextHub.init$(metaContextId).subscribe();
      postman.incomingMessage$.next(
        new BffContextInitMessage(metaContextId, {
          id: '123',
        }),
      );

      // Инициализируем контекст пользователей
      contextHub.init$(usersContextId).subscribe();
      postman.incomingMessage$.next(
        new BffContextInitMessage(usersContextId, {
          '123': { name: 'User 123' },
          '456': { name: 'User 456' },
        }),
      );

      const placeholderKeyConfigId = 'output-placeholder-key';
      const placeholderKeyConfig: OutputConfig<string> = {
        id: placeholderKeyConfigId,
        class: ServerComponentClass.UnitTestOutput,
        properties: {
          ref: 'users.@{meta.id}.name',
        },
      };

      const { component: placeholderKeyComponent } =
        createOutputComponent(placeholderKeyConfig);

      // Изначально плейсхолдер в ключе указывает на users.123.name
      expect(placeholderKeyComponent.value()).toBe('User 123');

      // Меняем meta.id, теперь ключ должен указывать на users.456.name
      postman.incomingMessage$.next(
        new BffContextValuesMessage(metaContextId, [
          { key: 'id', value: '456' },
        ]),
      );

      expect(placeholderKeyComponent.value()).toBe('User 456');
    });
  });
});
