import { DimensionalUnit } from "../enums/dimensional-unit";
import type { DimensionalValue } from "./dimensional-value";

/**
 * Поведение flex-item внутри родительского stack.
 * `{ grow }` — доля свободного места; `{ basis }` — размер (число > 1 — логические px);
 * либо явные `basis` / `grow` / `shrink`.
 */
export type FlexItemSpec = {
  basis?: number | DimensionalValue;
  grow?: number;
  shrink?: number;
};

export function isDimensionalValue(value: unknown): value is DimensionalValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "value" in value &&
    "unit" in value &&
    typeof (value as DimensionalValue).value === "number" &&
    typeof (value as DimensionalValue).unit === "string"
  );
}

export function isFlexItemSpec(value: unknown): value is FlexItemSpec {
  return (
    typeof value === "object" && value !== null && !isDimensionalValue(value)
  );
}

/**
 * Число в `basis` > 1 трактуется как логические пиксели (`unit: px`).
 */
export function normalizeFlexItem(
  flexItem: FlexItemSpec | undefined,
): FlexItemSpec | undefined {
  if (flexItem === undefined) {
    return undefined;
  }
  if (flexItem.basis === undefined) {
    return flexItem;
  }
  return {
    ...flexItem,
    basis:
      typeof flexItem.basis === "number"
        ? normalizeSizeNumber(flexItem.basis)
        : flexItem.basis,
  };
}

function normalizeSizeNumber(value: number): number | DimensionalValue {
  if (value > 1) {
    return { value, unit: DimensionalUnit.Px };
  }
  return value;
}
