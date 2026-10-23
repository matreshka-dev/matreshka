import { describe, expect, it, vi } from 'vitest';
import type { ContextHubService } from '../../../services/context-hub.service';
import {
  applyContextPatch,
  applyContextValueUpdates,
} from './apply-context-value-updates';

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

describe('applyContextPatch', () => {
  it('применяет patch одного контекста одним setValues', () => {
    const setValues = vi.fn();
    const replacePlaceholders = vi.fn((key: string) => key);
    const contextHub = {
      setValues,
      replacePlaceholders,
    } as unknown as ContextHubService;

    applyContextPatch(contextHub, 'ctx-a', {
      loading: true,
      dirty: true,
    });

    expect(setValues).toHaveBeenCalledTimes(1);
    expect(setValues).toHaveBeenCalledWith('ctx-a', [
      { key: 'loading', value: true },
      { key: 'dirty', value: true },
    ]);
  });

  it('раскрывает плейсхолдеры в ключах patch', () => {
    const setValues = vi.fn();
    const replacePlaceholders = vi.fn((key: string) =>
      key.replace('@{meta-ctx.id1.index}', '0'),
    );
    const contextHub = {
      setValues,
      replacePlaceholders,
    } as unknown as ContextHubService;

    applyContextPatch(contextHub, 'page-ctx', {
      'devices.@{meta-ctx.id1.index}.status': 'on',
    });

    expect(setValues).toHaveBeenCalledWith('page-ctx', [
      { key: 'devices.0.status', value: 'on' },
    ]);
  });
});
