import { needsMore, scrollDistanceToEnd } from '@shared/utils/needs-more';
import { describe, expect, it } from 'vitest';

describe('needsMore', () => {
  it('returns true near scroll end', () => {
    const payload = { offset: 880, viewportSize: 100, contentSize: 1000 };
    expect(scrollDistanceToEnd(payload)).toBe(20);
    expect(needsMore(payload, 120)).toBe(true);
  });

  it('returns false when far from end and content fills viewport', () => {
    const payload = { offset: 0, viewportSize: 800, contentSize: 2000 };
    expect(needsMore(payload, 120)).toBe(false);
  });

  it('returns true when content is shorter than viewport', () => {
    const payload = { offset: 0, viewportSize: 1200, contentSize: 600 };
    expect(needsMore(payload, 120)).toBe(true);
  });
});
