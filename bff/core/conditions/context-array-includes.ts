import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { Paths } from "ts-essentials";
import { ContextRef } from "../context/context-ref";
import { Condition } from "./condition";
import {
  ArrayIncludesOperand,
  CompatibleArrayContextRef,
  ContextRefArrayElement,
  toWireOperand,
} from "./condition-operand";

/**
 * Условие: в массиве из контекста есть элемент, у которого значение по
 * `itemPath` равно операнду (литерал или `ContextRef`).
 *
 * Пустой `itemPath` сравнивает сам элемент массива (для массивов примитивов).
 *
 * @internal Используйте {@link contextArrayIncludes} / {@link when.includes}.
 */
export class ContextArrayIncludes<
  R extends ContextRef,
  P extends Paths<ContextRefArrayElement<R>> | "" = "",
> extends Condition {
  constructor(
    ref: CompatibleArrayContextRef<R>,
    itemPath: P,
    value: ArrayIncludesOperand<R, P>,
  ) {
    super(ConditionType.ContextArrayIncludes, {
      ref,
      itemPath,
      value: toWireOperand(value),
    });
  }
}

/** Функциональная форма {@link ContextArrayIncludes}. */
export function contextArrayIncludes<
  R extends ContextRef,
  P extends Paths<ContextRefArrayElement<R>> | "" = "",
>(
  ref: CompatibleArrayContextRef<R>,
  itemPath: P,
  value: ArrayIncludesOperand<R, P>,
): ContextArrayIncludes<R, P> {
  return new ContextArrayIncludes(ref, itemPath, value);
}

/**
 * Условие: в массиве из контекста нет элемента, у которого значение по
 * `itemPath` равно операнду (литерал или `ContextRef`).
 *
 * Пустой `itemPath` сравнивает сам элемент массива (для массивов примитивов).
 *
 * @internal Используйте {@link contextArrayNotIncludes} / {@link when.excludes}.
 */
export class ContextArrayNotIncludes<
  R extends ContextRef,
  P extends Paths<ContextRefArrayElement<R>> | "" = "",
> extends Condition {
  constructor(
    ref: CompatibleArrayContextRef<R>,
    itemPath: P,
    value: ArrayIncludesOperand<R, P>,
  ) {
    super(ConditionType.ContextArrayNotIncludes, {
      ref,
      itemPath,
      value: toWireOperand(value),
    });
  }
}

/** Функциональная форма {@link ContextArrayNotIncludes}. */
export function contextArrayNotIncludes<
  R extends ContextRef,
  P extends Paths<ContextRefArrayElement<R>> | "" = "",
>(
  ref: CompatibleArrayContextRef<R>,
  itemPath: P,
  value: ArrayIncludesOperand<R, P>,
): ContextArrayNotIncludes<R, P> {
  return new ContextArrayNotIncludes(ref, itemPath, value);
}
