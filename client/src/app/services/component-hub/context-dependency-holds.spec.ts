import { describe, expect, it, vi } from 'vitest';
import type { PathContextDependency } from './component-config-entry.types';
import {
  diffContextIdSets,
  extractContextIds,
  syncContextHolds,
} from './context-dependency-holds';

describe('context-dependency-holds', () => {
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
    expect(extractContextIds(map)).toEqual(new Set(['a', 'b']));
  });

  it('diffContextIdSets находит added и removed', () => {
    const prev = new Set(['a', 'b']);
    const next = new Set(['b', 'c']);
    expect(diffContextIdSets(prev, next)).toEqual({
      added: ['c'],
      removed: ['a'],
    });
  });

  it('syncContextHolds вызывает retain/release на hub', () => {
    const hub = {
      retain: vi.fn(),
      release: vi.fn(),
    };
    syncContextHolds(hub, new Set(['old']), new Set(['new']));
    expect(hub.release).toHaveBeenCalledWith('old');
    expect(hub.retain).toHaveBeenCalledWith('new');
  });

  it('diffContextIdSets не дублирует id при симметричном пересечении', () => {
    const prev = new Set(['a', 'b']);
    const next = new Set(['b', 'c']);
    expect(diffContextIdSets(prev, next)).toEqual({
      added: ['c'],
      removed: ['a'],
    });
  });
});
