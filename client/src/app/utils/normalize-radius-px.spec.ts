import { describe, expect, it } from 'vitest';
import { normalizeRadiusPx } from './normalize-radius-px';

describe('normalizeRadiusPx', () => {
  it('applies numeric radius to every logical corner', () => {
    expect(normalizeRadiusPx(8)).toEqual({
      topStart: 8,
      topEnd: 8,
      bottomStart: 8,
      bottomEnd: 8,
    });
  });

  it('applies grouped logical values as fallbacks for corners', () => {
    expect(
      normalizeRadiusPx({
        all: 2,
        top: 4,
        start: 6,
        bottomEnd: 8,
      }),
    ).toEqual({
      topStart: 4,
      topEnd: 4,
      bottomStart: 6,
      bottomEnd: 8,
    });
  });

  it('keeps unspecified corners undefined', () => {
    expect(normalizeRadiusPx({ topStart: 8 })).toEqual({
      topStart: 8,
      topEnd: undefined,
      bottomStart: undefined,
      bottomEnd: undefined,
    });
  });
});
