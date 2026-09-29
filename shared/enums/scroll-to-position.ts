/**
 * Зарезервированные цели прокрутки для {@link Stack.scrollTo} и `component-scroll-to`.
 *
 * Любое другое отрицательное `value` — отступ от конца: `maxScroll + value`
 * (например `-16` — 16 логических px до низа).
 */
export enum ScrollToPosition {
  /** Начало оси скролла (`scrollTop` / `scrollLeft` = 0). */
  Start = 0,
  /**
   * Конец оси скролла. Значение зарезервировано протоколом — в коде используйте
   * только `ScrollToPosition.End`, не литерал числа.
   */
  End = -2_147_483_648,
}
