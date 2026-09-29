import { describe, expect, it } from 'vitest';
import {
  collectContextRefDependencies,
  contextChangeAffectsRef,
} from './collect-context-ref-dependencies';

describe('collectContextRefDependencies', () => {
  it('собирает основной ref и плейсхолдеры strictRef', () => {
    const userCtx = 'ctx-user';
    const shopCtx = 'ctx-shop';
    const ref = `${userCtx}.cart.items.@{${shopCtx}.offers.0.id}`;

    expect(collectContextRefDependencies(ref)).toEqual([
      {
        contextId: userCtx,
        key: `cart.items.@{${shopCtx}.offers.0.id}`,
      },
      { contextId: shopCtx, key: 'offers.0.id' },
    ]);
  });
});

describe('contextChangeAffectsRef', () => {
  const userCtx = 'ctx-user';
  const shopCtx = 'ctx-shop';
  const ref = `${userCtx}.cart.items.@{${shopCtx}.offers.0.id}`;

  it('реагирует на ContextInit placeholder-контекста', () => {
    expect(
      contextChangeAffectsRef({ contextId: shopCtx, values: [] }, ref),
    ).toBe(true);
  });

  it('реагирует на изменение поля из placeholder-контекста', () => {
    expect(
      contextChangeAffectsRef(
        {
          contextId: shopCtx,
          values: [{ key: 'offers.0.id', value: 42 }],
        },
        ref,
      ),
    ).toBe(true);
  });

  it('реагирует на изменение cart до резолва плейсхолдера', () => {
    expect(
      contextChangeAffectsRef(
        {
          contextId: userCtx,
          values: [{ key: 'cart.items.42', value: { quantity: 1 } }],
        },
        ref,
        () => {
          throw new Error('context not loaded');
        },
      ),
    ).toBe(true);
  });

  it('реагирует на изменение cart после резолва плейсхолдера', () => {
    expect(
      contextChangeAffectsRef(
        {
          contextId: userCtx,
          values: [{ key: 'cart.items.42', value: { quantity: 1 } }],
        },
        ref,
        () => 'cart.items.42',
      ),
    ).toBe(true);
  });

  it('игнорирует нерелевантный контекст', () => {
    expect(
      contextChangeAffectsRef(
        {
          contextId: 'ctx-other',
          values: [{ key: 'field', value: 1 }],
        },
        ref,
      ),
    ).toBe(false);
  });
});
