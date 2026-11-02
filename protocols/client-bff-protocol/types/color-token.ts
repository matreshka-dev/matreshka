import { ColorTokenMaskType } from "../enums/color-token-mask-type";
import { TimingFunction } from "../enums/timing-function";

export type ColorTokenPalette = {
  /** Базовый цвет роли без интерактивного состояния. */
  default: string;
  /** Наведение */
  hover?: string;
  /** Нажатие */
  active?: string;
  /** Клавиатурный/видимый фокус */
  focus?: string;
};

/** Параметры transition для одного состояния. duration обязателен — без него transition бессмысленен. */
export type ColorTokenTransition = {
  /** Длительность перехода (мс), как в AnimateComponentConfig. */
  duration: number;
  timingFunction?: TimingFunction;
};

/**
 * Shorthand + overrides:
 * - `{ duration: 300 }` → все состояния
 * - `{ hover: { duration: 200 } }` → только hover
 * - `{ duration: 300, hover: { duration: 150 } }` → default/active/focus 300ms, hover 150ms
 *
 * Top-level `duration`/`timingFunction` — опциональный fallback.
 * Per-state overrides (`default`/`hover`/`active`/`focus`) — `ColorTokenTransition` с обязательным `duration`.
 */
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
  /** 0–100, %. Если нет — stop без позиции (как в CSS shorthand). */
  at?: number;
};

export type ColorTokenLinearGradientMask = {
  type: ColorTokenMaskType.LinearGradient;
  /** Направление градиента в градусах (как в CSS `linear-gradient(Ndeg, …)`). */
  direction?: number;
  stops: LinearGradientMaskStop[];
};

export type ColorTokenMask = ColorTokenLinearGradientMask;

type ColorTokenCommon = {
  transition?: ColorTokenTransitions;
  mask?: ColorTokenMask;
};

export type ColorToken =
  | (ColorTokenPalette & ColorTokenCommon)
  | ({
      light: ColorTokenPalette;
      dark: ColorTokenPalette;
    } & ColorTokenCommon);
