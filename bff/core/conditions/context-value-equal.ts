import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { ContextRef } from "../context/context-ref";
import { Condition } from "./condition";
import { ConditionOperand, toWireOperand } from "./condition-operand";

/**
 * Условие: значение по `ref` строго равно операнду
 * (литерал того же примитивного типа или значение по другой `ContextRef`).
 *
 * @internal Используйте {@link contextValueEqual} / {@link when.equals}.
 */
export class ContextValueEqual<R extends ContextRef> extends Condition {
  constructor(ref: R, value: ConditionOperand<R>) {
    super(ConditionType.ContextValueEqual, {
      ref,
      value: toWireOperand(value),
    });
  }
}

/** Функциональная форма {@link ContextValueEqual}. */
export function contextValueEqual<R extends ContextRef>(
  ref: R,
  value: ConditionOperand<R>,
): ContextValueEqual<R> {
  return new ContextValueEqual(ref, value);
}
