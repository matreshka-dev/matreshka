import { TimingFunction } from "../enums/timing-function";
import type {
  ColorTokenTransition,
  ColorTokenTransitions,
} from "../types/color-token";

export const COLOR_TOKEN_STATES = ["default", "hover", "active"] as const;
export type ColorTokenState = (typeof COLOR_TOKEN_STATES)[number];

export type ResolvedColorTokenTransition = ColorTokenTransition & {
  timingFunction: TimingFunction;
};

/**
 * Сводит shorthand и per-state overrides `ColorToken.transition`
 * к карте состояний, у которых есть duration.
 */
export function resolveColorTokenTransitions(
  transition?: ColorTokenTransitions,
): Partial<Record<ColorTokenState, ResolvedColorTokenTransition>> {
  if (!transition) {
    return {};
  }

  const resolved: Partial<
    Record<ColorTokenState, ResolvedColorTokenTransition>
  > = {};

  for (const state of COLOR_TOKEN_STATES) {
    const merged = {
      duration: transition.duration,
      timingFunction: transition.timingFunction,
      ...transition[state],
    };
    if (merged.duration != null) {
      resolved[state] = {
        duration: merged.duration,
        timingFunction: merged.timingFunction ?? TimingFunction.Ease,
      };
    }
  }

  return resolved;
}
