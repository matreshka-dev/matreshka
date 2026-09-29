import { TimingFunction } from '@shared/enums/timing-function';
import { resolveColorTokenTransitions } from '@shared/utils/resolve-color-token-transitions';
import { describe, expect, it } from 'vitest';

describe('resolveColorTokenTransitions', () => {
  it('возвращает пустой объект, если transition не задан', () => {
    expect(resolveColorTokenTransitions()).toEqual({});
    expect(resolveColorTokenTransitions(undefined)).toEqual({});
  });

  it('не генерирует состояния без duration', () => {
    expect(
      resolveColorTokenTransitions({
        timingFunction: TimingFunction.EaseIn,
      }),
    ).toEqual({});
  });

  it('применяет shorthand duration ко всем состояниям', () => {
    expect(
      resolveColorTokenTransitions({
        duration: 300,
        timingFunction: TimingFunction.EaseInOut,
      }),
    ).toEqual({
      default: {
        duration: 300,
        timingFunction: TimingFunction.EaseInOut,
      },
      hover: {
        duration: 300,
        timingFunction: TimingFunction.EaseInOut,
      },
      active: {
        duration: 300,
        timingFunction: TimingFunction.EaseInOut,
      },
    });
  });

  it('подставляет Ease, если timingFunction не задан', () => {
    expect(resolveColorTokenTransitions({ duration: 200 })).toEqual({
      default: { duration: 200, timingFunction: TimingFunction.Ease },
      hover: { duration: 200, timingFunction: TimingFunction.Ease },
      active: { duration: 200, timingFunction: TimingFunction.Ease },
    });
  });

  it('резолвит transition только для заданного состояния', () => {
    expect(
      resolveColorTokenTransitions({
        hover: {
          duration: 200,
          timingFunction: TimingFunction.EaseOut,
        },
      }),
    ).toEqual({
      hover: {
        duration: 200,
        timingFunction: TimingFunction.EaseOut,
      },
    });
  });

  it('мержит shorthand с per-state override', () => {
    expect(
      resolveColorTokenTransitions({
        duration: 300,
        timingFunction: TimingFunction.EaseInOut,
        hover: { duration: 150 },
        active: {
          duration: 100,
          timingFunction: TimingFunction.EaseIn,
        },
      }),
    ).toEqual({
      default: {
        duration: 300,
        timingFunction: TimingFunction.EaseInOut,
      },
      hover: {
        duration: 150,
        timingFunction: TimingFunction.EaseInOut,
      },
      active: {
        duration: 100,
        timingFunction: TimingFunction.EaseIn,
      },
    });
  });
});
