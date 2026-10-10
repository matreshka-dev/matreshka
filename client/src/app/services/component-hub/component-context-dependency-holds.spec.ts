import { describe, expect, it, vi } from 'vitest';
import type { PathContextDependency } from './component-config-entry.types';
import { ComponentContextDependencyHolds } from './component-context-dependency-holds';

describe('ComponentContextDependencyHolds', () => {
  it('extractContextIds собирает уникальные contextId', () => {
    const map = new Map<string, PathContextDependency[]>([
      [
        'ref',
        [
          { contextId: 'a', key: 'x', rerender: false },
          { contextId: 'b', key: 'y', rerender: true },
        ],
      ],
      ['rules', [{ contextId: 'a', rerender: false }]],
    ]);
    expect(ComponentContextDependencyHolds.extractContextIds(map)).toEqual(
      new Set(['a', 'b']),
    );
  });

  it('diffContextIdSets находит added и removed', () => {
    const prev = new Set(['a', 'b']);
    const next = new Set(['b', 'c']);
    expect(
      ComponentContextDependencyHolds.diffContextIdSets(prev, next),
    ).toEqual({
      added: ['c'],
      removed: ['a'],
    });
  });

  it('releaseAll снимает holds и очищает heldContextIds', () => {
    const holds = new ComponentContextDependencyHolds();
    const onLast = vi.fn();
    holds.bindEvictHandler(onLast);
    holds.addConsumer('ctx-a');
    holds.addConsumer('ctx-b');
    const entry = {
      heldContextIds: new Set(['ctx-a', 'ctx-b']),
    } as Parameters<ComponentContextDependencyHolds['releaseAll']>[0];

    holds.releaseAll(entry);

    expect(holds.holdCount('ctx-a')).toBe(0);
    expect(holds.holdCount('ctx-b')).toBe(0);
    expect(entry.heldContextIds.size).toBe(0);
    expect(onLast).toHaveBeenCalledWith('ctx-a');
    expect(onLast).toHaveBeenCalledWith('ctx-b');
  });

  it('updateResolvedConfigWithHolds синхронизирует счётчик при смене dependencies', () => {
    const holds = new ComponentContextDependencyHolds();
    const onLast = vi.fn();
    holds.bindEvictHandler(onLast);
    holds.addConsumer('old');
    const entry = {
      heldContextIds: new Set<string>(['old']),
      contextDependencies: new Map<string, PathContextDependency[]>([
        ['ref', [{ contextId: 'new', rerender: false }]],
      ]),
    } as Parameters<
      ComponentContextDependencyHolds['updateResolvedConfigWithHolds']
    >[0];

    const changed = holds.updateResolvedConfigWithHolds(
      entry,
      false,
      () => true,
      (e) =>
        ComponentContextDependencyHolds.extractContextIds(
          e.contextDependencies,
        ),
    );

    expect(changed).toBe(true);
    expect(holds.holdCount('old')).toBe(0);
    expect(holds.holdCount('new')).toBe(1);
    expect(onLast).toHaveBeenCalledWith('old');
    expect(entry.heldContextIds).toEqual(new Set(['new']));
  });

  it('updateResolvedConfigWithHolds не трогает счётчик если resolveHoldContextIds не изменился', () => {
    const holds = new ComponentContextDependencyHolds();
    holds.addConsumer('a');
    const entry = {
      heldContextIds: new Set<string>(['a']),
      contextDependencies: new Map(),
    } as Parameters<
      ComponentContextDependencyHolds['updateResolvedConfigWithHolds']
    >[0];

    holds.updateResolvedConfigWithHolds(
      entry,
      false,
      () => false,
      () => new Set(['a']),
    );

    expect(holds.holdCount('a')).toBe(1);
  });
});
