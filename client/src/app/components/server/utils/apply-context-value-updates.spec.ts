import { describe, expect, it, vi } from 'vitest';
import type { ContextHubService } from '../../../services/context-hub.service';
import { applyContextValueUpdates } from './apply-context-value-updates';

describe('applyContextValueUpdates', () => {
  it('группирует обновления по contextId и вызывает setValues', () => {
    const setValues = vi.fn();
    const replacePlaceholders = vi.fn((ref: string) => ref);
    const contextHub = {
      setValues,
      replacePlaceholders,
    } as unknown as ContextHubService;

    applyContextValueUpdates(contextHub, [
      { ref: 'ctx-a.loading', value: true },
      { ref: 'ctx-a.dirty', value: true },
      { ref: 'ctx-b.enabled', value: false },
    ]);

    expect(setValues).toHaveBeenCalledTimes(2);
    expect(setValues).toHaveBeenCalledWith('ctx-a', [
      { key: 'loading', value: true },
      { key: 'dirty', value: true },
    ]);
    expect(setValues).toHaveBeenCalledWith('ctx-b', [
      { key: 'enabled', value: false },
    ]);
  });

  it('раскрывает плейсхолдеры в ref перед записью (forEach index)', () => {
    const setValues = vi.fn();
    const replacePlaceholders = vi.fn((ref: string) =>
      ref.replace('@{meta-ctx.id1.index}', '0'),
    );
    const contextHub = {
      setValues,
      replacePlaceholders,
    } as unknown as ContextHubService;

    applyContextValueUpdates(contextHub, [
      {
        ref: 'page-ctx.devices.@{meta-ctx.id1.index}.status',
        value: 'on',
      },
    ]);

    expect(replacePlaceholders).toHaveBeenCalledWith(
      'page-ctx.devices.@{meta-ctx.id1.index}.status',
    );
    expect(setValues).toHaveBeenCalledWith('page-ctx', [
      { key: 'devices.0.status', value: 'on' },
    ]);
  });
});
