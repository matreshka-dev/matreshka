import { ConditionType } from '@shared/enums/condition-type';
import { ServerComponentClass } from '@shared/enums/server-component-class';
import { firstValueFrom } from 'rxjs';
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

  it('должен учитывать плейсхолдеры из override неактивного rule в heldContextIds', async () => {
    await env.initContext('ctx-mode', { mode: 'default' });

    const config: { properties: { title: string } } & ServerComponentConfig = {
      id: 'config-holds-inactive-rule',
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
            title: '@{ctx-rule-only.name}',
          },
        },
      ],
    };

    env.mockServerComponents[
      ServerComponentClass.UnitTest
    ].dependencies.pathsWithPlaceholdersInTemplate = ['title'];

    env.service.registerConfig(config);
    await firstValueFrom(env.service.ready$(config));

    const entry = hubConfigEntry(env.service, config.id);
    expect(entry.heldContextIds.has('ctx-rule-only')).toBe(true);
    expect(env.contextHub.holdCount('ctx-rule-only')).toBe(1);
  });
});
