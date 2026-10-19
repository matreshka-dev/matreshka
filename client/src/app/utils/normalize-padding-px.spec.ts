import { describe, expect, it } from 'vitest';
import { normalizePaddingPx } from './normalize-padding-px';

describe('normalizePaddingPx', () => {
  it('applies numeric padding to every logical side', () => {
    expect(normalizePaddingPx(16)).toEqual({
      top: 16,
      bottom: 16,
      start: 16,
      end: 16,
    });
  });

  it('expands axis-only padding', () => {
    expect(normalizePaddingPx({ vertical: 8, horizontal: 12 })).toEqual({
      top: 8,
      bottom: 8,
      start: 12,
      end: 12,
    });
  });

  it('combines axis fallbacks with explicit sides', () => {
    expect(normalizePaddingPx({ horizontal: 16, bottom: 8 })).toEqual({
      top: 0,
      bottom: 8,
      start: 16,
      end: 16,
    });

    expect(normalizePaddingPx({ vertical: 12, start: 20 })).toEqual({
      top: 12,
      bottom: 12,
      start: 20,
      end: 0,
    });
  });

  it('still normalizes legacy mixed axis and side keys from wire', () => {
    expect(
      normalizePaddingPx({
        vertical: 16,
        horizontal: 8,
        top: 4,
        end: 24,
      }),
    ).toEqual({
      top: 4,
      bottom: 16,
      start: 8,
      end: 24,
    });
  });
});
