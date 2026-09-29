import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { ContextRef } from "../context/context-ref";
import { Condition } from "./condition";

/**
 * Условие, означающее, что в контексте определено значение по заданному ключу.
 *
 * @internal Используйте {@link contextValueDefined} / {@link when.defined}.
 */
export class ContextValueDefined extends Condition {
  constructor(ref: ContextRef) {
    super(ConditionType.ContextValueDefined, { ref });
  }
}

/** Функциональная форма {@link ContextValueDefined}. */
export function contextValueDefined(ref: ContextRef): ContextValueDefined {
  return new ContextValueDefined(ref);
}
