import { ColorTokenMaskType } from "../enums/color-token-mask-type";
import { TimingFunction } from "../enums/timing-function";
export type ColorTokenPalette = {
    default: string;
    hover?: string;
    active?: string;
    focus?: string;
};
export type ColorTokenTransition = {
    duration: number;
    timingFunction?: TimingFunction;
};
export type ColorTokenTransitions = {
    duration?: number;
    timingFunction?: TimingFunction;
    default?: ColorTokenTransition;
    hover?: ColorTokenTransition;
    active?: ColorTokenTransition;
    focus?: ColorTokenTransition;
};
export type LinearGradientMaskStop = {
    color: string;
    at?: number;
};
export type ColorTokenLinearGradientMask = {
    type: ColorTokenMaskType.LinearGradient;
    direction?: number;
    stops: LinearGradientMaskStop[];
};
export type ColorTokenMask = ColorTokenLinearGradientMask;
type ColorTokenCommon = {
    transition?: ColorTokenTransitions;
    mask?: ColorTokenMask;
};
export type ColorToken = (ColorTokenPalette & ColorTokenCommon) | ({
    light: ColorTokenPalette;
    dark: ColorTokenPalette;
} & ColorTokenCommon);
export {};
