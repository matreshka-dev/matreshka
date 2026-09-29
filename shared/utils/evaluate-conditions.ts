import { ArrayLengthCompare } from "../enums/array-length-compare";
import { ConditionGroupOperator } from "../enums/condition-group-operator";
import { ConditionType } from "../enums/condition-type";
import { DeviceType } from "../enums/device-type";
import type { SerializedOperand } from "../types/serialized-operand";
import { fetchFromObject } from "./fetch-from-object";
import { resolveSerializedOperand } from "./serialized-operand";

type ContextValueCondition<Ref> =
  | {
      type: ConditionType.ContextValueEqual;
      payload: {
        ref: Ref;
        value: SerializedOperand;
      };
    }
  | {
      type: ConditionType.ContextValueNotEqual;
      payload: {
        ref: Ref;
        value: SerializedOperand;
      };
    }
  | {
      type: ConditionType.ContextValueIn;
      payload: {
        ref: Ref;
        value: SerializedOperand[];
      };
    }
  | {
      type: ConditionType.ContextValueDefined;
      payload: {
        ref: Ref;
      };
    }
  | {
      type: ConditionType.ContextValueUndefined;
      payload: {
        ref: Ref;
      };
    }
  | {
      type: ConditionType.ContextArrayLength;
      payload: {
        ref: Ref;
        length: SerializedOperand;
        operator: ArrayLengthCompare;
      };
    }
  | {
      type: ConditionType.ContextArrayIncludes;
      payload: {
        ref: Ref;
        itemPath: string;
        value: SerializedOperand;
      };
    }
  | {
      type: ConditionType.ContextArrayNotIncludes;
      payload: {
        ref: Ref;
        itemPath: string;
        value: SerializedOperand;
      };
    };

type DeviceCondition =
  | { type: ConditionType.MobileDevice }
  | { type: ConditionType.TabletDevice }
  | { type: ConditionType.DesktopDevice }
  | { type: ConditionType.NotTabletDevice }
  | { type: ConditionType.NotMobileDevice }
  | { type: ConditionType.NotDesktopDevice };

type GroupCondition<Ref> = {
  type: ConditionType.Group;
  payload: {
    operator: ConditionGroupOperator;
    conditions: readonly EvaluatableCondition<Ref>[];
  };
};

export type EvaluatableCondition<Ref = string> =
  | ContextValueCondition<Ref>
  | DeviceCondition
  | GroupCondition<Ref>;

export type EvaluateConditionsOptions<Ref = string> = {
  getContextValue: (ref: Ref) => unknown;
  getDeviceType?: () => DeviceType;
  unloadedValue?: unknown;
};

function arrayLengthMatches(
  actual: number,
  target: number,
  operator: ArrayLengthCompare,
): boolean {
  switch (operator) {
    case ArrayLengthCompare.Equal:
      return actual === target;
    case ArrayLengthCompare.LessThan:
      return actual < target;
    case ArrayLengthCompare.LessOrEqual:
      return actual <= target;
    case ArrayLengthCompare.GreaterThan:
      return actual > target;
    case ArrayLengthCompare.GreaterOrEqual:
      return actual >= target;
  }

  return false;
}

function evaluateDeviceCondition(
  condition: DeviceCondition,
  getDeviceType?: () => DeviceType,
): boolean {
  if (!getDeviceType) {
    return false;
  }

  const deviceType = getDeviceType();
  switch (condition.type) {
    case ConditionType.MobileDevice:
      return deviceType === DeviceType.Mobile;
    case ConditionType.NotMobileDevice:
      return deviceType !== DeviceType.Mobile;
    case ConditionType.TabletDevice:
      return deviceType === DeviceType.Tablet;
    case ConditionType.NotTabletDevice:
      return deviceType !== DeviceType.Tablet;
    case ConditionType.DesktopDevice:
      return deviceType === DeviceType.Desktop;
    case ConditionType.NotDesktopDevice:
      return deviceType !== DeviceType.Desktop;
  }

  return false;
}

function resolveOperand<Ref>(
  operand: SerializedOperand,
  options: EvaluateConditionsOptions<Ref>,
): unknown {
  return resolveSerializedOperand(operand, (ref) =>
    options.getContextValue(ref as Ref),
  );
}

function evaluateConditionList<Ref>(
  conditions: readonly EvaluatableCondition<Ref>[],
  operator: ConditionGroupOperator,
  options: EvaluateConditionsOptions<Ref>,
): boolean {
  if (conditions.length === 0) {
    return operator === ConditionGroupOperator.And;
  }

  const evaluate = (condition: EvaluatableCondition<Ref>) =>
    evaluateSingleCondition(condition, options);

  return operator === ConditionGroupOperator.And
    ? conditions.every(evaluate)
    : conditions.some(evaluate);
}

function evaluateSingleCondition<Ref>(
  condition: EvaluatableCondition<Ref>,
  options: EvaluateConditionsOptions<Ref>,
): boolean {
  if (condition.type === ConditionType.Group) {
    return evaluateConditionList(
      condition.payload.conditions,
      condition.payload.operator,
      options,
    );
  }

  if ("payload" in condition && "ref" in condition.payload) {
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
          typeof length === "number" &&
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
        return typeof value !== "undefined";
      case ConditionType.ContextValueUndefined:
        return typeof value === "undefined";
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

export function evaluateConditions<Ref = string>(
  conditions: readonly EvaluatableCondition<Ref>[],
  options: EvaluateConditionsOptions<Ref>,
): boolean {
  return evaluateConditionList(conditions, ConditionGroupOperator.And, options);
}
