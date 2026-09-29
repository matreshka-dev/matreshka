import { ComponentAnimationEffect } from '@shared/enums/component-animation-effect';
import { TimingFunction } from '@shared/enums/timing-function';
import type {
  ComponentAnimationEffects,
  DimensionalKeyframeStops,
} from '@shared/types/component-animation';
import type { DimensionalValue } from '@shared/types/dimensional-value';

export type ComponentAnimationPayload = {
  /** Базовый id компонента или instance id — см. AnimateComponentConfig.componentId на BFF. */
  componentId?: string;
  duration: number;
  timingFunction?: TimingFunction;
  effects: ComponentAnimationEffects;
  delay?: number;
};

/** BFF onShow / onHide → animate-component; нужен, чтобы отличать направление in-flight анимации. */
export type ComponentAnimationPurpose = 'show' | 'hide';

export type RunComponentAnimationsOptions = {
  pseudoElement?: string;
};

type AnimationWithPurpose = Animation & {
  __componentAnimationPurpose?: ComponentAnimationPurpose;
};

/**
 * WAAPI не даёт надёжно прочитать playbackDirection в нашей версии DOM-типов.
 * Ведём флаг сами: каждый reverse() инвертирует «сейчас идём к shown или hidden».
 */
const animationReversed = new WeakMap<Animation, boolean>();

/** Помечает анимации, созданные runComponentAnimations (не чужие getAnimations()). */
export function markComponentAnimations(
  animations: Animation[],
  purpose: ComponentAnimationPurpose,
): void {
  for (const animation of animations) {
    (animation as AnimationWithPurpose).__componentAnimationPurpose = purpose;
    animationReversed.set(animation, false);
  }
}

export function getComponentAnimationPurpose(
  animation: Animation,
): ComponentAnimationPurpose | undefined {
  return (animation as AnimationWithPurpose).__componentAnimationPurpose;
}

/** In-flight show/hide на элементе; finished с fill:forwards сюда не попадают. */
export function getActiveComponentAnimations(
  element: HTMLElement,
): Animation[] {
  return element.getAnimations().filter((animation) => {
    if (!getComponentAnimationPurpose(animation)) {
      return false;
    }
    return animation.playState === 'running';
  });
}

function isAnimationReversed(animation: Animation): boolean {
  return animationReversed.get(animation) ?? false;
}

/**
 * Эффективное направление с учётом purpose и числа reverse():
 * show вперёд и hide назад → toward shown; show назад и hide вперёд → toward hidden.
 */
export function isAnimationTowardShown(
  animation: Animation,
  purpose: ComponentAnimationPurpose,
): boolean {
  const reversed = isAnimationReversed(animation);
  return purpose === 'hide' ? reversed : !reversed;
}

/**
 * При смене conditions/display во время анимации — что развернуть через reverse().
 * Например, hide ещё идёт, а элемент снова должен быть visible → reverse hide.
 */
export function selectAnimationsToReverse(
  element: HTMLElement,
  wantVisible: boolean,
): Animation[] {
  return getActiveComponentAnimations(element).filter((animation) => {
    const purpose = getComponentAnimationPurpose(animation);
    if (!purpose) {
      return false;
    }
    return isAnimationTowardShown(animation, purpose) !== wantVisible;
  });
}

/** После reverse() или при обычном hide — ждём завершения, не запуская дублирующий onHide. */
export function getActiveAnimationsTowardHidden(
  element: HTMLElement,
): Animation[] {
  return getActiveComponentAnimations(element).filter((animation) => {
    const purpose = getComponentAnimationPurpose(animation);
    if (!purpose) {
      return false;
    }
    return !isAnimationTowardShown(animation, purpose);
  });
}

/** In-flight анимации, которые уже ведут к shown (в т.ч. reverse hide). */
export function getActiveAnimationsTowardShown(
  element: HTMLElement,
): Animation[] {
  return getActiveComponentAnimations(element).filter((animation) => {
    const purpose = getComponentAnimationPurpose(animation);
    if (!purpose) {
      return false;
    }
    return isAnimationTowardShown(animation, purpose);
  });
}

/** finished может reject при cancel — для цепочек display$ это не ошибка. */
export function waitForAnimations(
  animations: readonly Animation[],
): Promise<void> {
  if (animations.length === 0) {
    return Promise.resolve();
  }
  return Promise.all(
    animations.map((animation) => animation.finished.catch(() => undefined)),
  ).then(() => undefined);
}

/**
 * Разворот in-flight WAAPI; повторный вызов снова меняет направление.
 * RxJS-unsubscribe не отменяет element.animate — reverse() синхронизирует UI с conditions.
 */
export function reverseComponentAnimations(
  animations: readonly Animation[],
): Promise<void> {
  if (animations.length === 0) {
    return Promise.resolve();
  }
  for (const animation of animations) {
    animation.reverse();
    animationReversed.set(animation, !isAnimationReversed(animation));
  }
  return Promise.all(
    animations.map((animation) => animation.finished.catch(() => undefined)),
  ).then(() => undefined);
}

function formatDimensional(v: number | DimensionalValue): string {
  if (typeof v === 'number') {
    return `${v}px`;
  }
  return `${v.value}${v.unit}`;
}

function buildTransformAtOffset(
  translateX: DimensionalKeyframeStops | undefined,
  translateY: DimensionalKeyframeStops | undefined,
  pct: number,
): string | undefined {
  const hasX = translateX && Object.keys(translateX).length > 0;
  const hasY = translateY && Object.keys(translateY).length > 0;
  if (!hasX && !hasY) {
    return undefined;
  }
  const parts: string[] = [];
  if (hasX) {
    const xv = translateX[pct];
    parts.push(
      xv !== undefined
        ? `translateX(${formatDimensional(xv)})`
        : 'translateX(0px)',
    );
  }
  if (hasY) {
    const yv = translateY[pct];
    parts.push(
      yv !== undefined
        ? `translateY(${formatDimensional(yv)})`
        : 'translateY(0px)',
    );
  }
  return parts.join(' ');
}

function buildKeyframesForPayload(
  payload: ComponentAnimationPayload,
): Keyframe[] {
  const opacity = payload.effects[ComponentAnimationEffect.Opacity];
  const blur = payload.effects[ComponentAnimationEffect.Blur];
  const backdropBlur = payload.effects[ComponentAnimationEffect.BackdropBlur];
  const translateX = payload.effects[ComponentAnimationEffect.TranslateX];
  const translateY = payload.effects[ComponentAnimationEffect.TranslateY];

  const merged = new Map<number, Keyframe>();

  const mergeAtPercent = (pct: number, props: Partial<Keyframe>) => {
    const offset = pct / 100;
    const prev: Keyframe = merged.get(offset) ?? { offset };
    Object.assign(prev, props);
    merged.set(offset, prev);
  };

  if (opacity) {
    for (const [pctStr, v] of Object.entries(opacity)) {
      if (v !== undefined) {
        mergeAtPercent(Number(pctStr), { opacity: v });
      }
    }
  }

  if (blur) {
    for (const [pctStr, v] of Object.entries(blur)) {
      if (v !== undefined) {
        mergeAtPercent(Number(pctStr), {
          filter: `blur(${formatDimensional(v)})`,
        });
      }
    }
  }

  if (backdropBlur) {
    for (const [pctStr, v] of Object.entries(backdropBlur)) {
      if (v !== undefined) {
        mergeAtPercent(Number(pctStr), {
          backdropFilter: `blur(${formatDimensional(v)})`,
        });
      }
    }
  }

  const translatePctSet = new Set<number>();
  for (const k of Object.keys(translateX ?? {})) {
    translatePctSet.add(Number(k));
  }
  for (const k of Object.keys(translateY ?? {})) {
    translatePctSet.add(Number(k));
  }
  const sortedTranslate = [...translatePctSet].sort((a, b) => a - b);
  for (const pct of sortedTranslate) {
    const transform = buildTransformAtOffset(translateX, translateY, pct);
    if (transform !== undefined) {
      mergeAtPercent(pct, { transform });
    }
  }

  return [...merged.entries()].sort(([a], [b]) => a - b).map(([, kf]) => kf);
}

/**
 * Запускает одну или несколько анимаций через Web Animations API (element.animate).
 * Несколько payload дают несколько параллельных Animation на одном элементе.
 * @returns Promise, который резолвится после завершения всех анимаций.
 */
export function runComponentAnimations(
  element: HTMLElement,
  payloads: readonly ComponentAnimationPayload[],
  purpose?: ComponentAnimationPurpose,
  options?: RunComponentAnimationsOptions,
): Promise<Animation[]> {
  const animations: Animation[] = [];

  for (const payload of payloads) {
    const keyframes = buildKeyframesForPayload(payload);
    if (keyframes.length === 0) {
      continue;
    }

    const timing =
      payload.timingFunction !== undefined
        ? payload.timingFunction
        : TimingFunction.Ease;

    const animationOptions: KeyframeAnimationOptions = {
      duration: payload.duration,
      delay: payload.delay ?? 0,
      easing: timing,
      fill: 'forwards',
    };
    if (options?.pseudoElement) {
      animationOptions.pseudoElement = options.pseudoElement;
    }

    const anim = element.animate(keyframes, animationOptions);
    animations.push(anim);
  }

  if (animations.length === 0) {
    return Promise.resolve([]);
  }

  if (purpose) {
    markComponentAnimations(animations, purpose);
  }

  return Promise.all(animations.map((animation) => animation.finished)).then(
    () => animations,
  );
}
