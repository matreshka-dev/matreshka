import { ComponentAnimationEffect } from "../enums/component-animation-effect";
import type { DimensionalValue } from "./dimensional-value";
export type { DimensionalValue } from "./dimensional-value";
export type OpacityKeyframeStops = Partial<Record<number, number>>;
export type DimensionalKeyframeStops = Partial<Record<number, number | DimensionalValue>>;
export type ComponentAnimationEffects = Partial<{
    [ComponentAnimationEffect.Opacity]: OpacityKeyframeStops;
    [ComponentAnimationEffect.Blur]: DimensionalKeyframeStops;
    [ComponentAnimationEffect.BackdropBlur]: DimensionalKeyframeStops;
    [ComponentAnimationEffect.TranslateX]: DimensionalKeyframeStops;
    [ComponentAnimationEffect.TranslateY]: DimensionalKeyframeStops;
}>;
