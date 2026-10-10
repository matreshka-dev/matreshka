import { ConditionType } from '@shared/enums/condition-type';
import { ServerComponentClass } from '@shared/enums/server-component-class';
import { ContextInitMessage as BffToClientContextInitMessage } from '@shared/messages/bff-to-client/context/context-init-message';
import { firstValueFrom } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ServerComponent } from '../../components/server/server-component';
import { ServerComponentConfig } from '../../components/server/server-component-config';
import { hubConfigEntry, useComponentHubTestEnv } from './hub-test-harness';

describe('ComponentConfigRules (через ComponentHubService)', () => {
  const env = useComponentHubTestEnv();

  it('должен применять overrides активных rules и обновлять кешированный конфиг при смене активного правила', async () => {
    await env.initContext('ctx1', { mode: 'default' });

    const config: { properties: { title: string } } & ServerComponentConfig = {
      id: 'config-rules-context-switch',
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
                ref: 'ctx1.mode',
                value: { kind: 'literal', value: 'alt' },
              },
            },
          ],
          overrides: {
            title: 'alt',
          },
        },
      ],
    };

    env.service.registerConfig(config);
    await firstValueFrom(env.service.ready$(config));

    let rerenderCalled = false;
    env.service
      .addInstance(config.id, {
        config,
      } as unknown as ServerComponent<ServerComponentConfig>)
      .subscribe(() => {
        rerenderCalled = true;
      });

    expect(env.service.getConfigSnapshot(config.id)).toBe(config);
    expect(config.properties.title).toBe('default');

    env.contextHub.setValues('ctx1', [{ key: 'mode', value: 'alt' }]);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(rerenderCalled).toBe(false);
    expect(config.properties.title).toBe('alt');
  });

  it('должен переиспользовать кеш resolved-конфига при возврате к прежнему набору активных rules', async () => {
    await env.initContext('ctx1', { mode: 'default' });

    const config: { properties: { title: string } } & ServerComponentConfig = {
      id: 'config-rules-cache',
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
                ref: 'ctx1.mode',
                value: { kind: 'literal', value: 'alt' },
              },
            },
          ],
          overrides: {
            title: 'alt',
          },
        },
      ],
    };

    env.service.registerConfig(config);
    await firstValueFrom(env.service.ready$(config));

    const entry = hubConfigEntry(env.service, config.id);
    expect(entry.resolvedConfigs.size).toBe(1);

    env.contextHub.setValues('ctx1', [{ key: 'mode', value: 'alt' }]);
    await new Promise((resolve) => setTimeout(resolve, 100));
    env.contextHub.setValues('ctx1', [{ key: 'mode', value: 'default' }]);
    await new Promise((resolve) => setTimeout(resolve, 100));
    env.contextHub.setValues('ctx1', [{ key: 'mode', value: 'alt' }]);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(entry.resolvedConfigs.size).toBe(2);
    expect(config.properties.title).toBe('alt');
  });

  it('должен вызывать ререндер при изменении значений из template-плейсхолдеров активного rule', async () => {
    env.mockServerComponents[
      ServerComponentClass.UnitTest
    ].dependencies.pathsWithPlaceholdersInTemplate = ['title'];

    await env.initContext('ctx1', { name: 'John' });
    await env.initContext('ctx2', { enabled: true });

    const config: { properties: { title: string } } & ServerComponentConfig = {
      id: 'config-rules-template-placeholders',
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
                ref: 'ctx2.enabled',
                value: { kind: 'literal', value: true },
              },
            },
          ],
          overrides: {
            title: 'Hello @{ctx1.name}',
          },
        },
      ],
    };

    env.service.registerConfig(config);
    await firstValueFrom(env.service.ready$(config));

    let rerenderCalled = false;
    env.service
      .addInstance(config.id, {
        config,
      } as unknown as ServerComponent<ServerComponentConfig>)
      .subscribe(() => {
        rerenderCalled = true;
      });

    env.contextHub.setValues('ctx1', [{ key: 'name', value: 'Jane' }]);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(rerenderCalled).toBe(true);
  });

  it('должен загружать контексты из новых плейсхолдеров, добавленных активным rule', async () => {
    env.mockServerComponents[
      ServerComponentClass.UnitTest
    ].dependencies.pathsWithPlaceholdersInTemplate = ['title'];

    await env.initContext('ctx-switch', { enabled: true });

    const initSpy = vi.spyOn(env.contextHub, 'init$');

    const config: { properties: { title: string } } & ServerComponentConfig = {
      id: 'config-rules-new-placeholder-context',
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
                ref: 'ctx-switch.enabled',
                value: { kind: 'literal', value: true },
              },
            },
          ],
          overrides: {
            title: 'Hello @{ctx-rule.name}',
          },
        },
      ],
    };

    env.service.registerConfig(config);

    const readyPromise = firstValueFrom(env.service.ready$(config));
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(initSpy).toHaveBeenCalledWith('ctx-rule');

    env.postman.incomingMessage$.next(
      new BffToClientContextInitMessage('ctx-rule', {
        name: 'Kate',
      }),
    );

    await readyPromise;

    const entry = hubConfigEntry(env.service, config.id);
    const deps = entry.contextDependencies.get('title');

    expect(env.contextHub.loaded('ctx-rule')).toBe(true);
    expect(deps).toEqual(
      expect.arrayContaining([
        { contextId: 'ctx-rule', key: 'name', rerender: true },
      ]),
    );
  });

  it('должен пересчитывать зависимости, когда rule активируется и добавляет новый плейсхолдер', async () => {
    env.mockServerComponents[
      ServerComponentClass.UnitTest
    ].dependencies.pathsWithPlaceholdersInTemplate = ['title'];

    await env.initContext('ctx-mode', { mode: 'default' });
    await env.initContext('ctx-user', { name: 'John' });

    const config: { properties: { title: string } } & ServerComponentConfig = {
      id: 'config-rules-activated-placeholder',
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
                ref: 'ctx-mode.mode',
                value: { kind: 'literal', value: 'alt' },
              },
            },
          ],
          overrides: {
            title: 'Hello @{ctx-user.name}',
          },
        },
      ],
    };

    env.service.registerConfig(config);
    await firstValueFrom(env.service.ready$(config));

    let rerenderCalled = false;
    env.service
      .addInstance(config.id, {
        config,
      } as unknown as ServerComponent<ServerComponentConfig>)
      .subscribe(() => {
        rerenderCalled = true;
      });

    env.contextHub.setValues('ctx-user', [{ key: 'name', value: 'Jane' }]);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(rerenderCalled).toBe(false);

    env.contextHub.setValues('ctx-mode', [{ key: 'mode', value: 'alt' }]);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const entry = hubConfigEntry(env.service, config.id);
    expect(entry.contextDependencies.get('title')).toEqual(
      expect.arrayContaining([
        { contextId: 'ctx-user', key: 'name', rerender: true },
      ]),
    );

    expect(config.properties.title).toBe('Hello @{ctx-user.name}');
    // До активации rule имя уже меняли на Jane — в override остаётся шаблон, значение из контекста.
    expect(env.contextHub.replacePlaceholders(config.properties.title)).toBe(
      'Hello Jane',
    );

    rerenderCalled = false;
    env.contextHub.setValues('ctx-user', [{ key: 'name', value: 'Alice' }]);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(rerenderCalled).toBe(true);
    expect(env.contextHub.replacePlaceholders(config.properties.title)).toBe(
      'Hello Alice',
    );
  });

  it('должен добавлять holds для contextId из override после активации rule', async () => {
    env.mockServerComponents[
      ServerComponentClass.UnitTest
    ].dependencies.pathsWithPlaceholdersInTemplate = ['title'];

    await env.initContext('ctx-mode', { mode: 'default' });
    await env.initContext('ctx-user', { name: 'John' });

    const config: { properties: { title: string } } & ServerComponentConfig = {
      id: 'config-rules-holds-on-activate',
      class: ServerComponentClass.UnitTest,
      properties: { title: 'default' },
      rules: [
        {
          conditions: [
            {
              type: ConditionType.ContextValueEqual,
              payload: {
                ref: 'ctx-mode.mode',
                value: { kind: 'literal', value: 'alt' },
              },
            },
          ],
          overrides: {
            title: 'Hello @{ctx-user.name}',
          },
        },
      ],
    };

    env.service.registerConfig(config);
    await firstValueFrom(env.service.ready$(config));

    expect(env.contextHub.holdCount('ctx-user')).toBe(0);

    env.contextHub.setValues('ctx-mode', [{ key: 'mode', value: 'alt' }]);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(env.contextHub.holdCount('ctx-user')).toBe(1);
    expect(
      hubConfigEntry(env.service, config.id).heldContextIds.has('ctx-user'),
    ).toBe(true);
  });

  it('должен переключать holds при смене активного rule с разными contextId в override', async () => {
    env.mockServerComponents[
      ServerComponentClass.UnitTest
    ].dependencies.pathsWithPlaceholdersInTemplate = ['title'];

    await env.initContext('ctx-mode', { mode: 'alt' });
    await env.initContext('ctx-a', { label: 'A' });
    await env.initContext('ctx-b', { label: 'B' });

    const config: { properties: { title: string } } & ServerComponentConfig = {
      id: 'config-rules-holds-switch',
      class: ServerComponentClass.UnitTest,
      properties: { title: 'default' },
      rules: [
        {
          conditions: [
            {
              type: ConditionType.ContextValueEqual,
              payload: {
                ref: 'ctx-mode.mode',
                value: { kind: 'literal', value: 'alt' },
              },
            },
          ],
          overrides: {
            title: '@{ctx-a.label}',
          },
        },
        {
          conditions: [
            {
              type: ConditionType.ContextValueEqual,
              payload: {
                ref: 'ctx-mode.mode',
                value: { kind: 'literal', value: 'other' },
              },
            },
          ],
          overrides: {
            title: '@{ctx-b.label}',
          },
        },
      ],
    };

    env.service.registerConfig(config);
    await firstValueFrom(env.service.ready$(config));

    expect(env.contextHub.holdCount('ctx-a')).toBe(1);
    expect(env.contextHub.holdCount('ctx-b')).toBe(0);

    env.contextHub.setValues('ctx-mode', [{ key: 'mode', value: 'other' }]);
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(env.contextHub.holdCount('ctx-a')).toBe(0);
    expect(env.contextHub.holdCount('ctx-b')).toBe(1);
  });

  it('должен учитывать вложенные плейсхолдеры в override активного rule', async () => {
    env.mockServerComponents[
      ServerComponentClass.UnitTest
    ].dependencies.pathsWithPlaceholdersInTemplate = ['title'];

    await env.initContext('ctx2', { nested: 'final' });
    await env.initContext('ctx1', { field: '@{ctx2.nested}' });
    await env.initContext('ctx-mode', { mode: 'alt' });

    const config: { properties: { title: string } } & ServerComponentConfig = {
      id: 'config-rules-nested-placeholder',
      class: ServerComponentClass.UnitTest,
      properties: { title: 'default' },
      rules: [
        {
          conditions: [
            {
              type: ConditionType.ContextValueEqual,
              payload: {
                ref: 'ctx-mode.mode',
                value: { kind: 'literal', value: 'alt' },
              },
            },
          ],
          overrides: {
            title: '@{ctx1.field}',
          },
        },
      ],
    };

    env.service.registerConfig(config);
    await firstValueFrom(env.service.ready$(config));

    const entry = hubConfigEntry(env.service, config.id);
    const titleDeps = entry.contextDependencies.get('title')!;
    const contextIds = titleDeps.map((d: { contextId: string }) => d.contextId);

    expect(contextIds).toContain('ctx1');
    expect(contextIds).toContain('ctx2');
    expect(env.contextHub.holdCount('ctx1')).toBe(1);
    expect(env.contextHub.holdCount('ctx2')).toBe(1);

    expect(config.properties.title).toBe('@{ctx1.field}');
    expect(env.contextHub.replacePlaceholders(config.properties.title)).toBe(
      'final',
    );
  });
});
