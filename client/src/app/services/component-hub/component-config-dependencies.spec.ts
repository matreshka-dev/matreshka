import { ConditionType } from '@shared/enums/condition-type';
import { ServerComponentClass } from '@shared/enums/server-component-class';
import { describe, expect, it, vi } from 'vitest';
import { ServerComponentConfig } from '../../components/server/server-component-config';
import { hubConfigEntry, useComponentHubTestEnv } from './hub-test-harness';

describe('calculateConfigContextDependencies', () => {
  const env = useComponentHubTestEnv();

  it('должен вычислять зависимости из плейсхолдеров', () => {
    const config: { properties: { title: string } } & ServerComponentConfig = {
      id: 'config-placeholders',
      class: ServerComponentClass.UnitTest,
      properties: { title: '@{ctx1.field}' },
    };

    env.mockServerComponents[
      ServerComponentClass.UnitTest
    ].dependencies.pathsWithPlaceholdersInTemplate = ['title'];

    const initSpy = vi.spyOn(env.contextHub, 'init$');

    env.service.registerConfig(config);

    const sub = env.service.ready$(config).subscribe();

    expect(initSpy).toHaveBeenCalledWith('ctx1');

    sub.unsubscribe();
  });

  it('должен учитывать плейсхолдеры в condition refs', () => {
    const userCtx = 'ctx-user';
    const shopCtx = 'ctx-shop';
    const cartItemRef = `${userCtx}.cart.items.@{${shopCtx}.offers.0.id}`;

    const config: ServerComponentConfig = {
      id: 'config-condition-placeholder-ref',
      class: ServerComponentClass.UnitTest,
      conditions: [
        {
          type: ConditionType.ContextValueDefined,
          payload: { ref: cartItemRef },
        },
      ],
    };

    const initSpy = vi.spyOn(env.contextHub, 'init$');

    env.service.registerConfig(config);

    const sub = env.service.ready$(config).subscribe();

    expect(initSpy).toHaveBeenCalledWith(userCtx);
    expect(initSpy).toHaveBeenCalledWith(shopCtx);

    const entry = hubConfigEntry(
      env.service,
      'config-condition-placeholder-ref',
    );
    const deps = entry.contextDependencies.get('%%%conditions%%%');
    const contextIds = deps.map((d: { contextId: string }) => d.contextId);

    expect(contextIds).toContain(userCtx);
    expect(contextIds).toContain(shopCtx);

    sub.unsubscribe();
  });

  it('должен обрабатывать вложенные плейсхолдеры', async () => {
    await env.initContext('ctx2', { nested: 'final' });
    await env.initContext('ctx1', { field: '@{ctx2.nested}' });

    const config: { properties: { title: string } } & ServerComponentConfig = {
      id: 'config-nested-placeholders',
      class: ServerComponentClass.UnitTest,
      properties: { title: '@{ctx1.field}' },
    };

    env.mockServerComponents[
      ServerComponentClass.UnitTest
    ].dependencies.pathsWithPlaceholdersInTemplate = ['title'];

    env.service.registerConfig(config);

    const entry = hubConfigEntry(env.service, 'config-nested-placeholders');
    expect(entry).toBeDefined();

    const deps = entry.contextDependencies.get('title');
    const contextIds = deps.map((d: { contextId: string }) => d.contextId);

    expect(contextIds).toContain('ctx1');
    expect(contextIds).toContain('ctx2');
  });
});
