import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ConditionType } from '@shared/enums/condition-type';
import { DimensionalUnit } from '@shared/enums/dimensional-unit';
import { ServerComponentClass } from '@shared/enums/server-component-class';
import { TextDecoration } from '@shared/enums/text-decoration';
import { ContextInitMessage as BffToClientContextInitMessage } from '@shared/messages/bff-to-client/context/context-init-message';
import { ComponentClickMessage } from '@shared/messages/client-to-bff/components/component-click-message';
import { PLATFORM } from '../../platforms/platform';
import { TestPlatform } from '../../platforms/tests/test-platform';
import { ComponentHubService } from '../../services/component-hub.service';
import { ContextHubService } from '../../services/context-hub.service';
import { PostmanService } from '../../services/postman.service';
import { SsrService } from '../../services/ssr.service';
import { TestPostmanService } from '../../services/tests/test-postman.service';
import { TestSsrService } from '../../services/tests/test-ssr.service';
import { ServerComponent } from './server-component';
import {
  ComponentDependencies,
  ServerComponentConfig,
} from './server-component-config';
import { SERVER_COMPONENTS } from './server-components-injection-token';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
class TestServerComponent extends ServerComponent<ServerComponentConfig> {}

describe('ServerComponent (abstract базовый компонент)', () => {
  let component: TestServerComponent;
  let componentHub: ComponentHubService;
  let postman: TestPostmanService;
  let contextHub: ContextHubService;
  let config: ServerComponentConfig;
  const configId = 'test-id';
  let fixture: ComponentFixture<TestServerComponent>;
  beforeEach(() => {
    const defaultDependencies: ComponentDependencies = {
      pathsWithPlaceholdersInTemplate: [],
      pathsWithPlaceholdersInCode: [],
      requiredContextsPaths: [],
      getNestedConfigsPaths: vi.fn(() => []),
    };

    TestBed.configureTestingModule({
      imports: [TestServerComponent],
      providers: [
        ComponentHubService,
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
            [ServerComponentClass.UnitTest]: {
              component: TestServerComponent,
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
    postman = TestBed.inject(PostmanService) as unknown as TestPostmanService;
    contextHub = TestBed.inject(ContextHubService);
    config = {
      id: configId,
      class: ServerComponentClass.UnitTest,
    };

    // Регистрируем каждый раз заново конфиг в реальном ComponentHubService, чтобы компонент получал его по id
    componentHub.registerConfig(config);

    fixture = TestBed.createComponent(TestServerComponent);
    fixture.componentRef.setInput('id', configId);
    component = fixture.componentInstance;
    (
      component as unknown as {
        _configSignal: { set(value: ServerComponentConfig): void };
      }
    )._configSignal.set(config);
  });

  afterEach(() => {
    fixture.destroy(); // Уничтожение компонента до удаления конфига, иначе компонент теряет значение конфига
    componentHub.deleteConfig(config);
  });

  describe('calculateStyles', () => {
    it('должен устанавливать flex-basis в rem и flex-grow 0 для { basis } в px', () => {
      config.properties = {
        flexItem: { basis: { value: 200, unit: DimensionalUnit.Px } },
      };

      component.calculateStyles();

      expect(component.componentStyles).toEqual({
        'flex-basis': '12.5rem',
        'flex-grow': '0',
        'flex-shrink': '0',
        'text-align': undefined,
      });
    });

    it('должен устанавливать flex-grow, если flexItem — { grow }', () => {
      config.properties = {
        flexItem: { grow: 0.5 },
      };

      component.calculateStyles();

      expect(component.componentStyles).toEqual({
        'flex-grow': 0.5,
        'text-align': undefined,
      });
    });

    it('должен устанавливать text-decoration и CSS-переменную', () => {
      config.properties = {
        textDecoration: TextDecoration.LineThrough,
      };

      component.calculateStyles();

      expect(component.componentStyles).toEqual({
        'text-align': undefined,
        'text-decoration': TextDecoration.LineThrough,
        '--text-decoration': TextDecoration.LineThrough,
      });
    });

    it('должен сбрасывать --size, если size не задан', () => {
      // Заполним, чтобы убедиться, что значение не остаётся/не наследуется
      component.componentStyles = { '--size': '123rem' };

      component.calculateStyles();

      expect(component.componentStyles).toEqual({
        'text-align': undefined,
      });
    });
  });

  describe('hostStyle', () => {
    it('должен возвращать текущие стили компонента', () => {
      component.componentStyles = { width: '6.25rem' };
      expect(component.hostStyle).toEqual({ width: '6.25rem' });
    });
  });

  describe('hasServerInteraction', () => {
    it('должен возвращать true, если есть server‑interaction для события', () => {
      config.interactions = {
        click: [
          { class: 'some-interaction', payload: {} },
          { class: 'server-interaction', payload: {} },
        ],
      };

      expect(component.hasServerInteraction('click')).toBe(true);
    });

    it('должен возвращать false, если server‑interaction отсутствует', () => {
      config.interactions = {
        click: [{ class: 'some-interaction', payload: {} }],
      };

      expect(component.hasServerInteraction('click')).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('должен регистрировать инстанс в ComponentHubService и реагировать на запрос ререндера', () => {
      const markForCheckSpy = vi.spyOn(component.cdr, 'markForCheck');

      const addInstanceSpy = vi.spyOn(componentHub, 'addInstance');

      component.ngOnInit();

      expect(addInstanceSpy).toHaveBeenCalledWith(configId, component);

      // Эмулируем запрос ререндера от ComponentHubService
      const map = (componentHub as any).map as Map<string, any>;
      const entry = map.get(configId);
      entry.requestRerender$.next();

      expect(markForCheckSpy).toHaveBeenCalled();
    });
  });

  describe('ngOnDestroy', () => {
    it('должен удалять инстанс, вызывать interact(hide, ...) и завершать destroy$', () => {
      const interactSpy = vi.spyOn(component, 'interact');
      const deleteInstanceSpy = vi.spyOn(componentHub, 'deleteInstance');

      let completed = false;
      component.destroy$.subscribe({
        complete: () => {
          completed = true;
        },
      });

      component.ngOnDestroy();

      expect(deleteInstanceSpy).toHaveBeenCalledWith(configId, component);
      expect(interactSpy).toHaveBeenCalledWith('hide', expect.any(Function));
      expect(completed).toBe(true);
    });

    it('не должен вызывать interact(hide, ...) во время entry destroy', () => {
      const interactSpy = vi.spyOn(component, 'interact');
      const deleteInstanceSpy = vi.spyOn(componentHub, 'deleteInstance');

      componentHub.beginEntryDestroy('entry-root');
      component.ngOnDestroy();
      componentHub.endEntryDestroy('entry-root');

      expect(deleteInstanceSpy).toHaveBeenCalledWith(configId, component);
      expect(interactSpy).not.toHaveBeenCalled();
    });
  });

  describe('mouseenter / mouseleave', () => {
    it('должен вызывать interact при наличии interactions', () => {
      const interactSpy = vi.spyOn(component, 'interact');

      config.interactions = {
        mouseenter: [{ class: 'server-interaction' } as any],
        mouseleave: [{ class: 'server-interaction' } as any],
      };

      component.onMouseEnter(new MouseEvent('mouseenter'));
      component.onMouseLeave(new MouseEvent('mouseleave'));

      expect(interactSpy).toHaveBeenCalledWith(
        'mouseenter',
        expect.any(Function),
      );
      expect(interactSpy).toHaveBeenCalledWith(
        'mouseleave',
        expect.any(Function),
      );
    });

    it('не должен вызывать interact без interactions', () => {
      const interactSpy = vi.spyOn(component, 'interact');

      config.interactions = {};

      component.onMouseEnter(new MouseEvent('mouseenter'));
      component.onMouseLeave(new MouseEvent('mouseleave'));

      expect(interactSpy).not.toHaveBeenCalled();
    });
  });

  describe('interact', () => {
    it('должен писать текст в буфер обмена и отправлять сообщение на сервер при наличии server‑interaction', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined);

      (globalThis as any).navigator = {
        clipboard: {
          writeText,
        },
      };

      const sentMessages: any[] = [];
      postman.outcomingMessage$.subscribe((msg) => sentMessages.push(msg));
      const replaceSpy = vi.spyOn(contextHub, 'replacePlaceholders');

      config.interactions = {
        click: [
          {
            class: 'write-text-to-clipboard',
            payload: { text: 'raw text' },
          },
          { class: 'server-interaction' } as any,
        ],
      };

      const message = { type: 'test-message' };

      component.interact('click', () => message as any); // indices не используются в заглушке

      expect(replaceSpy).toHaveBeenCalledWith('raw text');
      expect(writeText).toHaveBeenCalledWith('raw text');
      expect(sentMessages).toHaveLength(1);
      expect(sentMessages[0]).toBe(message);
    });

    it('должен передавать handlers в сообщение на BFF', () => {
      const sentMessages: unknown[] = [];
      postman.outcomingMessage$.subscribe((msg) => sentMessages.push(msg));

      config.interactions = {
        click: [
          { class: 'set-context-value', payload: { ref: 'x.y', value: 1 } },
          { class: 'server-interaction', payload: {} },
          { class: 'server-interaction', payload: {} },
        ],
      };

      component.interact(
        'click',
        (handlers) => new ComponentClickMessage(component.id()).setHandlers(handlers),
      );

      expect(sentMessages).toHaveLength(1);
      expect((sentMessages[0] as ComponentClickMessage).getHandlers()).toEqual([
        1, 2,
      ]);
    });

    it('должен логировать ошибку для неизвестного типа client‑interaction и не кидать исключение', () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      config.interactions = {
        click: [{ class: 'unknown-interaction' } as any],
      };

      const factory = (_indices: number[]) => ({}) as any;

      expect(() => component.interact('click', factory)).not.toThrow();

      expect(errorSpy).toHaveBeenCalledWith(
        'Unknown component interaction = unknown-interaction',
      );

      errorSpy.mockRestore();
    });

    it('не должен отправлять сообщение на сервер, если server‑interaction отсутствует', () => {
      const sentMessages: any[] = [];
      postman.outcomingMessage$.subscribe((msg) => sentMessages.push(msg));

      config.interactions = {
        click: [
          {
            class: 'write-text-to-clipboard',
            payload: { text: 'raw text' },
          },
        ],
      };

      const factory = (_indices: number[]) => ({}) as any;

      component.interact('click', factory);

      expect(sentMessages).toHaveLength(0);
    });

    it('должен снимать conditions до выполнения взаимоисключающих set-context-value', async () => {
      const contextId = 'toggle-ctx';
      const init$ = contextHub.init$(contextId);
      postman.incomingMessage$.next(
        new BffToClientContextInitMessage(contextId, { status: 'on' }),
      );
      await firstValueFrom(init$);

      const setValuesSpy = vi.spyOn(contextHub, 'setValues');

      config.interactions = {
        click: [
          {
            class: 'set-context-value',
            payload: { ref: `${contextId}.status`, value: 'off' },
            conditions: [
              {
                type: ConditionType.ContextValueEqual,
                payload: {
                  ref: `${contextId}.status`,
                  value: { kind: 'literal', value: 'on' },
                },
              },
            ],
          },
          {
            class: 'set-context-value',
            payload: { ref: `${contextId}.status`, value: 'on' },
            conditions: [
              {
                type: ConditionType.ContextValueEqual,
                payload: {
                  ref: `${contextId}.status`,
                  value: { kind: 'literal', value: 'off' },
                },
              },
            ],
          },
        ],
      };

      component.interact('click', (_indices) => ({}) as any);

      expect(setValuesSpy).toHaveBeenCalledTimes(1);
      expect(setValuesSpy).toHaveBeenCalledWith(contextId, [
        { key: 'status', value: 'off' },
      ]);
      expect(contextHub.value(`${contextId}.status`)).toBe('off');
    });
  });
});
