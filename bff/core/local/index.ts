import { animate } from "../actions/animate-component";
import { writeTextToClipboard } from "../actions/write-text-to-clipboard";

export type { ActionConfig } from "../actions/action";

export { DimensionalUnit } from "@matreshka/protocol/enums/dimensional-unit";
export type { DimensionalValue } from "@matreshka/protocol/types/dimensional-value";
export {
  animate,
  ComponentAnimationEffect,
  TimingFunction,
} from "../actions/animate-component";
export type {
  AnimateComponentConfig,
  ComponentAnimationEffects,
  DimensionalKeyframeStops,
  OpacityKeyframeStops,
} from "../actions/animate-component";

/**
 * Глобальные локальные (client-only) действия Matreshka BFF.
 */
export const local = {
  animate,
  writeTextToClipboard,
} as const;
