import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { ContextRef, ContextRefValue } from "../context/context-ref";
import { Condition } from "./condition";
import { UntypedConditionOperand, toWireOperand } from "./condition-operand";

type ContextArrayValue = readonly unknown[] | unknown[];

type CompatibleArrayContextRef<R extends ContextRef<any, any>> =
  Extract<ContextRefValue<R>, ContextArrayValue> extends never ? never : R;

/**
 * Условие: в массиве из контекста есть элемент, у которого значение по
 * `itemPath` равно операнду (литерал или `ContextRef`).
 *
 * Пустой `itemPath` сравнивает сам элемент массива (для массивов примитивов).
 *
 * @internal Используйте {@link contextArrayIncludes} / {@link when.includes}.
 */
export class ContextArrayIncludes<
  R extends ContextRef<any, any>,
> extends Condition {
  constructor(
    ref: CompatibleArrayContextRef<R>,
    itemPath: string,
    value: UntypedConditionOperand,
  ) {
    super(ConditionType.ContextArrayIncludes, {
      ref,
      itemPath,
      value: toWireOperand(value),
    });
  }
}

/** Функциональная форма {@link ContextArrayIncludes}. */
export function contextArrayIncludes<R extends ContextRef<any, any>>(
  ref: CompatibleArrayContextRef<R>,
  itemPath: string,
  value: UntypedConditionOperand,
): ContextArrayIncludes<R> {
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
  R extends ContextRef<any, any>,
> extends Condition {
  constructor(
    ref: CompatibleArrayContextRef<R>,
    itemPath: string,
    value: UntypedConditionOperand,
  ) {
    super(ConditionType.ContextArrayNotIncludes, {
      ref,
      itemPath,
      value: toWireOperand(value),
    });
  }
}

/** Функциональная форма {@link ContextArrayNotIncludes}. */
export function contextArrayNotIncludes<R extends ContextRef<any, any>>(
  ref: CompatibleArrayContextRef<R>,
  itemPath: string,
  value: UntypedConditionOperand,
): ContextArrayNotIncludes<R> {
  return new ContextArrayNotIncludes(ref, itemPath, value);
}
