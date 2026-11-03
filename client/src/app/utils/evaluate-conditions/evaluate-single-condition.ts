import { ConditionGroupOperator } from '@matreshka/client-bff-protocol/enums/condition-group-operator';
import { ConditionType } from '@matreshka/client-bff-protocol/enums/condition-type';
import type { Condition } from '@matreshka/client-bff-protocol/types/condition';
import type { SerializedOperand } from '@matreshka/client-bff-protocol/types/serialized-operand';
import { fetchFromObject } from '@matreshka/shared/utils/fetch-from-object';
import { resolveSerializedOperand } from '@matreshka/shared/utils/serialized-operand';
import { arrayLengthMatches } from './array-length-matches';
import type { EvaluateConditionsOptions } from './evaluate-conditions-options';
import { evaluateDeviceCondition } from './evaluate-device-condition';

function resolveOperand(
  operand: SerializedOperand,
  options: EvaluateConditionsOptions,
): unknown {
  return resolveSerializedOperand(operand, (ref) =>
    options.getContextValue(ref),
  );
}

export function evaluateConditionList(
  conditions: readonly Condition[],
  operator: ConditionGroupOperator,
  options: EvaluateConditionsOptions,
): boolean {
  if (conditions.length === 0) {
    return operator === ConditionGroupOperator.And;
  }

  const evaluate = (condition: Condition) =>
    evaluateSingleCondition(condition, options);

  return operator === ConditionGroupOperator.And
    ? conditions.every(evaluate)
    : conditions.some(evaluate);
}

export function evaluateSingleCondition(
  condition: Condition,
  options: EvaluateConditionsOptions,
): boolean {
  if (condition.type === ConditionType.Group) {
    return evaluateConditionList(
      condition.payload.conditions,
      condition.payload.operator,
      options,
    );
  }

  if ('payload' in condition && 'ref' in condition.payload) {
    const value = options.getContextValue(condition.payload.ref);
    if (value === options.unloadedValue) {
      return false;
    }

    switch (condition.type) {
      case ConditionType.ContextValueEqual: {
        const expected = resolveOperand(condition.payload.value, options);
        if (expected === options.unloadedValue) {
          return false;
        }
        return value === expected;
      }
      case ConditionType.ContextValueNotEqual: {
        const expected = resolveOperand(condition.payload.value, options);
        if (expected === options.unloadedValue) {
          return false;
        }
        return value !== expected;
      }
      case ConditionType.ContextValueIn: {
        const expectedValues: unknown[] = [];
        for (const operand of condition.payload.value) {
          const expected = resolveOperand(operand, options);
          if (expected === options.unloadedValue) {
            return false;
          }
          expectedValues.push(expected);
        }
        return expectedValues.includes(value);
      }
      case ConditionType.ContextArrayLength: {
        const length = resolveOperand(condition.payload.length, options);
        if (length === options.unloadedValue) {
          return false;
        }
        return (
          Array.isArray(value) &&
          typeof length === 'number' &&
          arrayLengthMatches(value.length, length, condition.payload.operator)
        );
      }
      case ConditionType.ContextArrayIncludes:
      case ConditionType.ContextArrayNotIncludes: {
        const expected = resolveOperand(condition.payload.value, options);
        if (expected === options.unloadedValue) {
          return false;
        }
        const includes = (value as unknown[]).some(
          (item) =>
            fetchFromObject(
              item as Record<string, unknown>,
              condition.payload.itemPath,
            ) === expected,
        );
        return condition.type === ConditionType.ContextArrayIncludes
          ? includes
          : !includes;
      }
      case ConditionType.ContextValueDefined:
        return typeof value !== 'undefined';
      case ConditionType.ContextValueUndefined:
        return typeof value === 'undefined';
    }
  }

  switch (condition.type) {
    case ConditionType.MobileDevice:
    case ConditionType.NotMobileDevice:
    case ConditionType.TabletDevice:
    case ConditionType.NotTabletDevice:
    case ConditionType.DesktopDevice:
    case ConditionType.NotDesktopDevice:
      return evaluateDeviceCondition(condition, options.getDeviceType);
  }

  return false;
}
