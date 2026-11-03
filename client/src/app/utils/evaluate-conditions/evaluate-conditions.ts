import { ConditionGroupOperator } from '@matreshka/client-bff-protocol/enums/condition-group-operator';
import type { Condition } from '@matreshka/client-bff-protocol/types/condition';
import type { EvaluateConditionsOptions } from './evaluate-conditions-options';
import { evaluateConditionList } from './evaluate-single-condition';

export type { EvaluateConditionsOptions } from './evaluate-conditions-options';

export function evaluateConditions(
  conditions: readonly Condition[],
  options: EvaluateConditionsOptions,
): boolean {
  return evaluateConditionList(conditions, ConditionGroupOperator.And, options);
}
