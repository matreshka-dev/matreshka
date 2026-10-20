import { ColorRole } from '@shared/enums/color-role';
import { ColorTokenMaskType } from '@shared/enums/color-token-mask-type';
import { TimingFunction } from '@shared/enums/timing-function';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { registerColorRole, registerColors } from './register-colors';

describe('registerColorRole', () => {
  beforeEach(() => {
    document.head.replaceChildren();
  });

  afterEach(() => {
    document.head.replaceChildren();
  });

  it('генерирует transition CSS vars для shorthand и hover override', () => {
    registerColors({
      'transition-scheme-1': {
        default: '#f5f7ff',
        hover: '#e8edff',
        active: '#d9e2ff',
        transition: {
          duration: 300,
          timingFunction: TimingFunction.EaseInOut,
          hover: { duration: 150 },
        },
      },
    });

    registerColorRole(document, 'transition-scheme-1', ColorRole.Background);

    const styles = Array.from(document.head.querySelectorAll('style'));
    const css = styles.map((style) => style.innerHTML).join('\n');

    expect(css).toContain('.color-token-transition-scheme-1-background');
    expect(css).toContain('--background-color-transition-duration: 300ms');
    expect(css).toContain(
      '--background-color-transition-timing-function: ease-in-out',
    );
    expect(css).toContain(
      '--background-color-transition-duration_hover: 150ms',
    );
    expect(css).toContain(
      '--background-color-transition-timing-function_hover: ease-in-out',
    );
    expect(css).toContain(
      '--background-color-transition-duration_active: 300ms',
    );
    expect(css).toContain('--background-color_focus: #f5f7ff');
    expect(css).toContain(
      '--background-color-transition-duration_focus: 300ms',
    );
  });

  it('fallback focus к default, если focus не задан', () => {
    registerColors({
      'focus-fallback-scheme': {
        default: '#111111',
        hover: '#222222',
      },
    });

    registerColorRole(document, 'focus-fallback-scheme', ColorRole.Text);

    const css = Array.from(document.head.querySelectorAll('style'))
      .map((style) => style.innerHTML)
      .join('\n');

    expect(css).toContain('--text-color_focus: #111111');
  });

  it('не генерирует transition vars, если transition не задан', () => {
    registerColors({
      'transition-scheme-2': {
        default: '#000000',
      },
    });

    registerColorRole(document, 'transition-scheme-2', ColorRole.Text);

    const css = Array.from(document.head.querySelectorAll('style'))
      .map((style) => style.innerHTML)
      .join('\n');

    expect(css).toContain('.color-token-transition-scheme-2-text');
    expect(css).not.toContain('--text-color-transition-duration');
  });

  it('генерирует vars только для явно заданного состояния', () => {
    registerColors({
      'transition-scheme-3': {
        default: '#fff',
        hover: '#eee',
        transition: {
          hover: {
            duration: 200,
            timingFunction: TimingFunction.EaseOut,
          },
        },
      },
    });

    registerColorRole(document, 'transition-scheme-3', ColorRole.Background);

    const css = Array.from(document.head.querySelectorAll('style'))
      .map((style) => style.innerHTML)
      .join('\n');

    expect(css).toContain(
      '--background-color-transition-duration_hover: 200ms',
    );
    expect(css).toContain(
      '--background-color-transition-timing-function_hover: ease-out',
    );
    expect(css).not.toContain('--background-color-transition-duration: 200ms');
    expect(css).not.toContain('--background-color-transition-duration_active');
  });

  it('сбрасывает --background-color-mask-image в none для токена без mask', () => {
    registerColors({
      'mask-scheme-plain': {
        default: '#ffffff',
      },
    });

    registerColorRole(document, 'mask-scheme-plain', ColorRole.Background);

    const css = Array.from(document.head.querySelectorAll('style'))
      .map((style) => style.innerHTML)
      .join('\n');

    expect(css).toContain('--background-color-mask-image: none');
  });

  it('генерирует --background-color-mask-image для токена с mask', () => {
    registerColors({
      'mask-scheme-1': {
        light: { default: 'rgba(236, 238, 244, 0.72)' },
        dark: { default: 'rgba(21, 21, 21, 0.72)' },
        mask: {
          type: ColorTokenMaskType.LinearGradient,
          direction: 180,
          stops: [
            { color: 'black', at: 70 },
            { color: 'transparent', at: 100 },
          ],
        },
      },
    });

    registerColorRole(document, 'mask-scheme-1', ColorRole.Background);

    const css = Array.from(document.head.querySelectorAll('style'))
      .map((style) => style.innerHTML)
      .join('\n');

    expect(css).toContain(
      '--background-color-mask-image: linear-gradient(180deg, black 70%, transparent 100%)',
    );
  });
});
