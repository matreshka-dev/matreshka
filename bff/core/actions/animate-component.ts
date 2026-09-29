import { ComponentAnimationEffect } from "@matreshka/shared/enums/component-animation-effect";
import { TimingFunction } from "@matreshka/shared/enums/timing-function";
import type { ComponentAnimationEffects } from "@matreshka/shared/types/component-animation";
import { ActionConditions } from "./action";
import { LocalAction } from "./local-action";

export { DimensionalUnit } from "@matreshka/shared/enums/dimensional-unit";
export type {
  ComponentAnimationEffects,
  DimensionalKeyframeStops,
  OpacityKeyframeStops,
} from "@matreshka/shared/types/component-animation";
export type { DimensionalValue } from "@matreshka/shared/types/dimensional-value";
export { ComponentAnimationEffect, TimingFunction };

/**
 * Конфигурация действия анимации компонента.
 */
export interface AnimateComponentConfig {
  /**
   * Целевой элемент по id: базовый id BFF-`Component` (анимация всех instance на клиенте)
   * или instance id (`uuid-0`, … — один конкретный DOM-инстанс).
   * Если не задано — анимируется тот же инстанс, у которого произошло событие (`interact`).
   */
  componentId?: string;
  /** Длительность анимации (мс). */
  duration: number;
  /** Карты keyframe по типам эффектов. */
  effects: ComponentAnimationEffects;
  /** Функция сглаживания по CSS; если не задана — на клиенте берётся значение по умолчанию. */
  timingFunction?: TimingFunction;
  /** Задержка перед стартом (мс). */
  delay?: number;
  /** Условия, при выполнении которых действие будет запущено на клиенте. */
  conditions?: ActionConditions;
}

/**
 * Локальное действие: анимация над компонентом на клиенте.
 *
 * @internal Используйте {@link animate}.
 */
export class AnimateComponent extends LocalAction {
  private readonly componentId: string | undefined;
  private readonly duration: number;
  private readonly timingFunction: TimingFunction | undefined;
  private readonly delay: number | undefined;
  private readonly effects: ComponentAnimationEffects;

  /**
   * @param config Параметры анимации.
   */
  constructor(config: AnimateComponentConfig) {
    super(config.conditions);
    this.componentId = config.componentId;
    this.duration = config.duration;
    this.effects = config.effects;
    this.timingFunction = config.timingFunction;
    this.delay = config.delay;
  }

  class(): string {
    return "animate-component";
  }

  payload(): object {
    return {
      componentId: this.componentId,
      duration: this.duration,
      timingFunction: this.timingFunction,
      effects: this.effects,
      delay: this.delay,
    };
  }
}

/**
 * Локальное действие: анимация над компонентом на клиенте.
 */
export function animate(config: AnimateComponentConfig): AnimateComponent {
  return new AnimateComponent(config);
}

/**
 * Функциональная форма {@link AnimateComponent}.
 *
 * @deprecated Используйте {@link animate}.
 */
export function animateComponent(
  config: AnimateComponentConfig,
): AnimateComponent {
  return animate(config);
}
