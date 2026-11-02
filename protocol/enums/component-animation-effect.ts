/**
 * Поддерживаемые типы визуальных эффектов анимации компонента (контракт BFF ↔ клиент).
 * Для blur, backdropBlur и translate на keyframes: число (blur трактуется как px) или `{ value, unit: DimensionalUnit }`.
 */
export enum ComponentAnimationEffect {
  Blur = "blur",
  BackdropBlur = "backdropBlur",
  Opacity = "opacity",
  TranslateX = "translateX",
  TranslateY = "translateY",
}
