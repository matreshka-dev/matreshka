import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ServerComponentClass } from '@shared/enums/server-component-class';
import {
  ContextInitMessage as BffContextInitMessage,
  ContextValuesMessage as BffContextValuesMessage,
} from '@shared/messages/bff-to-client/context';
import type { InputConfig } from '@shared/types/input-config';
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
import { InputDependencies } from './input-config';
import { ServerInputComponent } from './server-input-component';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
class TestServerInputComponent extends ServerInputComponent<
  InputConfig,
  string
> {
  override default(): string {
    return 'default-input';
  }
}

describe('ServerInputComponent', () => {
  let component: TestServerInputComponent;
  let fixture: ComponentFixture<TestServerInputComponent>;
  let componentHub: ComponentHubService;
  let contextHub: ContextHubService;
  let postman: TestPostmanService;

  const configId = 'input-test-id';
  let config: InputConfig;

  function mountComponent() {
    componentHub.registerConfig(config);
    fixture.detectChanges();
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestServerInputComponent],
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
            [ServerComponentClass.UnitTestInput]: {
              component: TestServerInputComponent,
              dependencies: InputDependencies,
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
      class: ServerComponentClass.UnitTestInput,
      properties: {
        ref: '',
      },
    };

    fixture = TestBed.createComponent(TestServerInputComponent);
    fixture.componentRef.setInput('id', configId);
    component = fixture.componentInstance;
    (
      component as unknown as {
        _configSignal: { set(value: InputConfig): void };
      }
    )._configSignal.set(config);
  });

  afterEach(() => {
    fixture.destroy();
    if (componentHub.getConfigSnapshot(config.id)) {
      componentHub.deleteConfig(config);
    }
  });

  describe('инициализация и обновление через ContextHub', () => {
    const contextId = 'ctx-input';

    beforeEach(() => {
      contextHub.init$(contextId).subscribe();
      postman.incomingMessage$.next(
        new BffContextInitMessage(contextId, {
          field: 'initial-from-context',
        }),
      );
      config.properties.ref = `${contextId}.field`;
    });

    it('должен инициализировать value из контекста по ключу', () => {
      mountComponent();

      expect(component.value()).toBe('initial-from-context');
    });

    it('должен использовать default(), если значение в контексте отсутствует', () => {
      config.properties.ref = `${contextId}.missing`;
      mountComponent();

      expect(component.value()).toBe('default-input');
    });

    it('должен обновлять value при изменении контекста', () => {
      mountComponent();

      expect(component.value()).toBe('initial-from-context');

      postman.incomingMessage$.next(
        new BffContextValuesMessage(contextId, [
          { key: 'field', value: 'updated-from-context' },
        ]),
      );

      expect(component.value()).toBe('updated-from-context');
    });

    it('не должен обновлять контекст при изменении его же значений (updatingFromContext)', () => {
      const setValuesSpy = vi.spyOn(contextHub, 'setValues');
      mountComponent();
      setValuesSpy.mockClear();

      postman.incomingMessage$.next(
        new BffContextValuesMessage(contextId, [
          { key: 'field', value: 'updated-from-context' },
        ]),
      );

      expect(component.value()).toBe('updated-from-context');
      expect(setValuesSpy).not.toHaveBeenCalled();
    });

    it('не должен менять value при получении того же значения из контекста', () => {
      mountComponent();
      const initialValue = component.value();

      postman.incomingMessage$.next(
        new BffContextValuesMessage(contextId, [
          { key: 'field', value: 'initial-from-context' },
        ]),
      );

      expect(component.value()).toBe(initialValue);
    });
  });

  describe('изменение значения через onChange', () => {
    const contextId = 'ctx-input-events';

    beforeEach(() => {
      contextHub.init$(contextId).subscribe();
      postman.incomingMessage$.next(
        new BffContextInitMessage(contextId, {
          field: 'from-context',
        }),
      );
      config.properties.ref = `${contextId}.field`;
      mountComponent();
    });

    it('onChange должен обновлять value и записывать значение в контекст', () => {
      const setValuesSpy = vi.spyOn(contextHub, 'setValues');
      setValuesSpy.mockClear();

      const event = {
        target: { value: 'new-change' },
      } as unknown as Event;

      component.onInputChange(event);

      expect(component.value()).toBe('new-change');
      fixture.detectChanges();
      expect(setValuesSpy).toHaveBeenCalledWith(contextId, [
        { key: 'field', value: 'new-change' },
      ]);
    });

    it('должен вызывать changeValue через effect при onChange без явного вызова', () => {
      const setValuesSpy = vi.spyOn(contextHub, 'setValues');
      setValuesSpy.mockClear();

      const event = {
        target: { value: 'auto-change' },
      } as unknown as Event;

      component.onInputChange(event);

      fixture.detectChanges();

      expect(component.value()).toBe('auto-change');
      expect(setValuesSpy).toHaveBeenCalledWith(contextId, [
        { key: 'field', value: 'auto-change' },
      ]);
    });
  });

  describe('плейсхолдеры в ключе', () => {
    const metaContextId = 'meta-input';
    const usersContextId = 'users-input';

    beforeEach(() => {
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

      config.properties.ref = `${usersContextId}.@{${metaContextId}.id}.name`;
      mountComponent();
    });

    it('должен инициализировать value по ключу с плейсхолдером', () => {
      expect(component.value()).toBe('User 123');
    });

    it('должен подставлять значения плейсхолдера при изменении value и записывать их в нужный контекст', () => {
      const setValuesSpy = vi.spyOn(contextHub, 'setValues');
      setValuesSpy.mockClear();
      fixture.detectChanges(); // Несколько detectChanges нужно чтобы корректно отслеживать effect в компоненте
      const event = {
        target: { value: 'Updated name' },
      } as unknown as Event;

      component.onInputChange(event);
      expect(component.value()).toBe('Updated name');
      fixture.detectChanges(); // Несколько detectChanges нужно чтобы корректно отслеживать effect в компоненте
      expect(setValuesSpy).toHaveBeenCalledWith(usersContextId, [
        { key: '123.name', value: 'Updated name' },
      ]);
    });

    it('должен обновлять value при смене значения плейсхолдера (смена ключа)', () => {
      expect(component.value()).toBe('User 123');

      postman.incomingMessage$.next(
        new BffContextValuesMessage(metaContextId, [
          { key: 'id', value: '456' },
        ]),
      );
      fixture.detectChanges();
      expect(component.value()).toBe('User 456');
    });

    it('должен записывать значение в контекст по новому ключу после смены плейсхолдера', () => {
      const setValuesSpy = vi.spyOn(contextHub, 'setValues');
      setValuesSpy.mockClear();

      postman.incomingMessage$.next(
        new BffContextValuesMessage(metaContextId, [
          { key: 'id', value: '456' },
        ]),
      );
      fixture.detectChanges(); // Несколько detectChanges нужно чтобы корректно отслеживать effect в компоненте
      const event = {
        target: { value: 'Updated name for 456' },
      } as unknown as Event;

      component.onInputChange(event);
      expect(component.value()).toBe('Updated name for 456');
      fixture.detectChanges(); // Несколько detectChanges нужно чтобы корректно отслеживать effect в компоненте
      expect(setValuesSpy).toHaveBeenCalledWith(usersContextId, [
        { key: '456.name', value: 'Updated name for 456' },
      ]);
    });
  });
});
