import type { PaddingPx } from "./padding-px";

/** Параметры прокрутки контейнера stack (CSS scroll-*). */
export type StackScroll = {
  /**
   * Отступ от краёв scrollport при scroll-snap и `scrollIntoView` (CSS `scroll-padding`).
   * Та же схема значений, что у `padding` stack.
   */
  padding?: PaddingPx;
};
