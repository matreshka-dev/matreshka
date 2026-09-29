export enum OverlayAnchor {
  // vertical
  Top = "top",
  Middle = "middle",
  Bottom = "bottom",
  // horizontal
  Start = "start",
  Center = "center",
  End = "end",
}

export type Overlay<TComponent> = {
  /**
   * Якоря позиционирования оверлея внутри контейнера.
   *
   * Правила:
   * - Можно задать несколько якорей.
   * - Должен быть задан хотя бы один якорь.
   * - Если заданы оба краевых якоря по оси (top+bottom или start+end), middle/center по этой оси теряют смысл.
   */
  anchors: [OverlayAnchor, ...OverlayAnchor[]];
  component: TComponent;
};
