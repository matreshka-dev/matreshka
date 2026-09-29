import { describe, expect, it } from 'vitest';

import { calculatePopoverWidth } from '../utils/calculate-styles';

describe('calculatePopoverWidth', () => {
  it('возвращает undefined, если size не задан', () => {
    expect(calculatePopoverWidth({})).toBeUndefined();
  });

  it('возвращает ширину в rem, если size больше 1', () => {
    expect(
      calculatePopoverWidth({
        size: 320,
      }),
    ).toBe('20rem');
  });

  it('возвращает ширину от anchor-size, если size меньше или равен 1', () => {
    expect(
      calculatePopoverWidth({
        size: 0.5,
      }),
    ).toBe('calc(anchor-size(width) * 0.5)');
  });

  it('не строит некорректную ширину для size <= 0', () => {
    expect(
      calculatePopoverWidth({
        size: 0,
      }),
    ).toBeUndefined();
  });
});
