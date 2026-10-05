import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { ContextRef } from "../context/context-ref";
import { Condition } from "./condition";
import { ConditionOperand, toWireOperand } from "./condition-operand";

/**
 * Условие: значение по `ref` входит в список операндов
 * (каждый элемент — литерал или `ContextRef`).
 *
 * @internal Используйте {@link contextValueIn} / {@link when.oneOf}.
 */
export class ContextValueIn<R extends ContextRef> extends Condition {
  constructor(ref: R, value: ConditionOperand<R>[]) {
    super(ConditionType.ContextValueIn, {
      ref,
      value: value.map(toWireOperand),
    });
  }
}

/** Функциональная форма {@link ContextValueIn}. */
export function contextValueIn<R extends ContextRef>(
  ref: R,
  value: ConditionOperand<R>[],
): ContextValueIn<R> {
  return new ContextValueIn(ref, value);
}
