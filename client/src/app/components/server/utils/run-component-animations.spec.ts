import { ComponentAnimationEffect } from '@shared/enums/component-animation-effect';
import { describe, expect, it, vi } from 'vitest';
import {
  getActiveAnimationsTowardHidden,
  getComponentAnimationPurpose,
  isAnimationTowardShown,
  markComponentAnimations,
  reverseComponentAnimations,
  runComponentAnimations,
  selectAnimationsToReverse,
} from './run-component-animations';

function mockElement(animations: Animation[]): HTMLElement {
  return {
    getAnimations: () => animations,
  } as unknown as HTMLElement;
}

function runningAnimation(): Animation {
  return {
    playState: 'running',
    finished: Promise.resolve(),
    reverse: () => undefined,
    cancel: () => undefined,
  } as unknown as Animation;
}

describe('component animation reverse', () => {
  it('помечает purpose у анимаций', () => {
    const animation = runningAnimation();
    markComponentAnimations([animation], 'hide');
    expect(getComponentAnimationPurpose(animation)).toBe('hide');
  });

  it('разворачивает hide, если нужен показ', () => {
    const animation = runningAnimation();
    markComponentAnimations([animation], 'hide');
    const element = mockElement([animation]);

    expect(selectAnimationsToReverse(element, true)).toEqual([animation]);
    expect(selectAnimationsToReverse(element, false)).toEqual([]);
  });

  it('разворачивает show, если нужно скрытие', () => {
    const animation = runningAnimation();
    markComponentAnimations([animation], 'show');
    const element = mockElement([animation]);

    expect(selectAnimationsToReverse(element, false)).toEqual([animation]);
    expect(selectAnimationsToReverse(element, true)).toEqual([]);
  });

  it('reverseComponentAnimations меняет направление hide', async () => {
    const animation = runningAnimation();
    markComponentAnimations([animation], 'hide');

    expect(isAnimationTowardShown(animation, 'hide')).toBe(false);
    await reverseComponentAnimations([animation]);
    expect(isAnimationTowardShown(animation, 'hide')).toBe(true);
  });

  it('getActiveAnimationsTowardHidden находит reverse show', async () => {
    const animation = runningAnimation();
    markComponentAnimations([animation], 'show');
    await reverseComponentAnimations([animation]);
    const element = mockElement([animation]);

    expect(getActiveAnimationsTowardHidden(element)).toEqual([animation]);
  });
});

describe('runComponentAnimations', () => {
  it('передаёт pseudoElement из options', async () => {
    const animate = vi.fn(() => ({
      finished: Promise.resolve(),
    }));
    const element = { animate } as unknown as HTMLElement;

    await runComponentAnimations(
      element,
      [
        {
          duration: 200,
          effects: {
            [ComponentAnimationEffect.Opacity]: {
              0: 0,
              100: 1,
            },
          },
        },
      ],
      'show',
      { pseudoElement: '::backdrop' },
    );

    expect(animate).toHaveBeenCalledWith(
      [
        { offset: 0, opacity: 0 },
        { offset: 1, opacity: 1 },
      ],
      expect.objectContaining({
        duration: 200,
        fill: 'forwards',
        pseudoElement: '::backdrop',
      }),
    );
  });

  it('мапит BackdropBlur в backdropFilter', async () => {
    const animate = vi.fn(() => ({
      finished: Promise.resolve(),
    }));
    const element = { animate } as unknown as HTMLElement;

    await runComponentAnimations(element, [
      {
        duration: 300,
        effects: {
          [ComponentAnimationEffect.BackdropBlur]: {
            0: 0,
            100: 16,
          },
        },
      },
    ]);

    expect(animate).toHaveBeenCalledWith(
      [
        { offset: 0, backdropFilter: 'blur(0px)' },
        { offset: 1, backdropFilter: 'blur(16px)' },
      ],
      expect.objectContaining({ duration: 300, fill: 'forwards' }),
    );
  });
});
