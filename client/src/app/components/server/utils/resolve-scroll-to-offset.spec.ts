import { ScrollToPosition } from '@shared/enums/scroll-to-position';
import { resolveScrollToOffset } from '@shared/utils/resolve-scroll-to-offset';
import { describe, expect, it } from 'vitest';

describe('resolveScrollToOffset', () => {
  const metrics = { scrollSize: 1000, viewportSize: 200 };

  it('uses value as absolute offset from start when non-negative', () => {
    expect(resolveScrollToOffset(metrics, ScrollToPosition.Start)).toBe(0);
    expect(resolveScrollToOffset(metrics, 120)).toBe(120);
  });

  it('scrolls to end for ScrollToPosition.End and -0', () => {
    expect(resolveScrollToOffset(metrics, ScrollToPosition.End)).toBe(800);
    expect(resolveScrollToOffset(metrics, -0)).toBe(800);
  });

  it('interprets other negative values as inset from scroll end', () => {
    expect(resolveScrollToOffset(metrics, -16)).toBe(784);
    expect(resolveScrollToOffset(metrics, -1)).toBe(799);
  });

  it('clamps to zero when inset exceeds scroll range', () => {
    expect(resolveScrollToOffset(metrics, -900)).toBe(0);
  });

  it('returns zero when content fits viewport', () => {
    expect(
      resolveScrollToOffset({ scrollSize: 100, viewportSize: 200 }, -16),
    ).toBe(0);
  });
});
