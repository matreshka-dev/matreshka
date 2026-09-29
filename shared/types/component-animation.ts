import { ComponentAnimationEffect } from "../enums/component-animation-effect";
import type { DimensionalValue } from "./dimensional-value";

export type { DimensionalValue } from "./dimensional-value";

/** Прозрачность: безразмерное число 0…1. */
export type OpacityKeyframeStops = Partial<Record<number, number>>;

/**
 * Число — обратная совместимость: для blur трактуется как px на клиенте.
 */
export type DimensionalKeyframeStops = Partial<
  Record<number, number | DimensionalValue>
>;

/** Карты keyframe по типам эффектов (контракт BFF ↔ клиент). */
export type ComponentAnimationEffects = Partial<{
  [ComponentAnimationEffect.Opacity]: OpacityKeyframeStops;
  [ComponentAnimationEffect.Blur]: DimensionalKeyframeStops;
  [ComponentAnimationEffect.BackdropBlur]: DimensionalKeyframeStops;
  [ComponentAnimationEffect.TranslateX]: DimensionalKeyframeStops;
  [ComponentAnimationEffect.TranslateY]: DimensionalKeyframeStops;
}>;
