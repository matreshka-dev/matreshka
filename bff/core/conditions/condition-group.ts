import { ConditionGroupOperator } from "@matreshka/shared/enums/condition-group-operator";
import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { Condition } from "./condition";

/**
 * Составное условие: все (`and`) или хотя бы одно (`or`) из вложенных условий.
 *
 * @internal Используйте {@link conditionAny} / {@link conditionAll} или {@link when.any} / {@link when.all}.
 */
export class ConditionGroup extends Condition {
  constructor(operator: ConditionGroupOperator, conditions: Condition[]) {
    super(ConditionType.Group, {
      operator,
      conditions: conditions.map((condition) => condition.toJSON()),
    });
  }
}

/** Хотя бы одно из условий (OR). */
export function conditionAny(conditions: Condition[]): ConditionGroup {
  return new ConditionGroup(ConditionGroupOperator.Or, conditions);
}

/** Все условия (AND) — явная группа, удобна внутри {@link conditionAny}. */
export function conditionAll(conditions: Condition[]): ConditionGroup {
  return new ConditionGroup(ConditionGroupOperator.And, conditions);
}
