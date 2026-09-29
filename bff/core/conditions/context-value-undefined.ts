import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { ContextRef } from "../context/context-ref";
import { Condition } from "./condition";

/**
 * Условие, означающее, что значение в контексте по заданному ключу не определено.
 *
 * @internal Используйте {@link contextValueUndefined} / {@link when.notDefined}.
 */
export class ContextValueUndefined extends Condition {
  constructor(ref: ContextRef) {
    super(ConditionType.ContextValueUndefined, { ref });
  }
}

/** Функциональная форма {@link ContextValueUndefined}. */
export function contextValueUndefined(ref: ContextRef): ContextValueUndefined {
  return new ContextValueUndefined(ref);
}
