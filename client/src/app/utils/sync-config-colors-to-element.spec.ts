import { ColorRole } from '@shared/enums/color-role';
import { beforeEach, describe, expect, it } from 'vitest';
import { registerColors } from './register-colors';
import { syncConfigColorsToElement } from './sync-config-colors-to-element';

describe('syncConfigColorsToElement', () => {
  let document: Document;
  let element: HTMLElement;
  let appliedColorClasses: Set<string>;

  beforeEach(() => {
    document = window.document;
    element = document.createElement('div');
    appliedColorClasses = new Set<string>();
    registerColors({
      'test-scheme-1': {
        default: '#000000',
      },
      'test-scheme-2': {
        default: '#ffffff',
      },
    });
  });

  it('должен добавлять CSS‑классы для каждой роли из colors', () => {
    syncConfigColorsToElement(
      document,
      element,
      {
        [ColorRole.Background]: 'test-scheme-1',
        [ColorRole.Text]: 'test-scheme-2',
        [ColorRole.Link]: 'test-scheme-2',
        [ColorRole.Icon]: 'test-scheme-2',
        [ColorRole.Placeholder]: 'test-scheme-2',
      },
      appliedColorClasses,
    );

    expect(
      element.classList.contains('color-token-test-scheme-1-background'),
    ).toBeTruthy();
    expect(element.classList.contains('color-token-test-scheme-2-text')).toBe(
      true,
    );
    expect(element.classList.contains('color-token-test-scheme-2-link')).toBe(
      true,
    );
    expect(element.classList.contains('color-token-test-scheme-2-icon')).toBe(
      true,
    );
    expect(
      element.classList.contains('color-token-test-scheme-2-placeholder'),
    ).toBe(true);
  });

  it('должен регистрировать стили для каждой роли', () => {
    syncConfigColorsToElement(
      document,
      element,
      {
        [ColorRole.Background]: 'test-scheme-1',
        [ColorRole.Text]: 'test-scheme-2',
        [ColorRole.Link]: 'test-scheme-2',
        [ColorRole.Icon]: 'test-scheme-2',
        [ColorRole.Placeholder]: 'test-scheme-2',
      },
      appliedColorClasses,
    );

    const styles = Array.from(document.head.querySelectorAll('style'));
    expect(
      styles.some((style) =>
        style.innerHTML.includes('.color-token-test-scheme-1-background'),
      ),
    ).toBe(true);
    expect(
      styles.some((style) =>
        style.innerHTML.includes('.color-token-test-scheme-2-text'),
      ),
    ).toBe(true);
  });

  it('не должен добавлять CSS‑классы, если colors не задан', () => {
    syncConfigColorsToElement(
      document,
      element,
      undefined,
      appliedColorClasses,
    );

    expect(
      Array.from(element.classList).some((cls) =>
        cls.startsWith('color-token-'),
      ),
    ).toBe(false);
  });

  it('снимает ранее применённые классы при обновлении colors', () => {
    syncConfigColorsToElement(
      document,
      element,
      { [ColorRole.Background]: 'test-scheme-1' },
      appliedColorClasses,
    );
    syncConfigColorsToElement(
      document,
      element,
      undefined,
      appliedColorClasses,
    );

    expect(
      element.classList.contains('color-token-test-scheme-1-background'),
    ).toBe(false);
  });
});
