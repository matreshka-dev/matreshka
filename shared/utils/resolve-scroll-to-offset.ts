import { ScrollToPosition } from "../enums/scroll-to-position";

export type ScrollAxisMetrics = {
  scrollSize: number;
  viewportSize: number;
};

/**
 * Преобразует `value` из `component-scroll-to` в абсолютный offset скролла.
 *
 * - {@link ScrollToPosition.Start} и другие `value >= 0` — от начала;
 * - {@link ScrollToPosition.End} и `-0` — в конец;
 * - иначе при `value < 0` — отступ от конца: `maxScroll + value`.
 */
export function resolveScrollToOffset(
  metrics: ScrollAxisMetrics,
  value: number,
): number {
  const maxScroll = Math.max(0, metrics.scrollSize - metrics.viewportSize);

  if (value === ScrollToPosition.End || Object.is(value, -0)) {
    return maxScroll;
  }
  if (value < 0) {
    return Math.max(0, maxScroll + value);
  }
  return value;
}
