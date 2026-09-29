import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { ContextRef } from "../context/context-ref";
import { Condition } from "./condition";
import { ConditionOperand, toWireOperand } from "./condition-operand";

/**
 * Условие: значение по `ref` не равно операнду
 * (литерал того же примитивного типа или значение по другой `ContextRef`).
 *
 * @internal Используйте {@link contextValueNotEqual} / {@link when.notEquals}.
 */
export class ContextValueNotEqual<
  R extends ContextRef<any, any>,
> extends Condition {
  constructor(ref: R, value: ConditionOperand<R>) {
    super(ConditionType.ContextValueNotEqual, {
      ref,
      value: toWireOperand(value),
    });
  }
}

/** Функциональная форма {@link ContextValueNotEqual}. */
export function contextValueNotEqual<R extends ContextRef<any, any>>(
  ref: R,
  value: ConditionOperand<R>,
): ContextValueNotEqual<R> {
  return new ContextValueNotEqual(ref, value);
}
