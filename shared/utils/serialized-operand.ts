import type { SerializedOperand } from "../types/serialized-operand";

export function isSerializedOperand(
  value: unknown,
): value is SerializedOperand {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (record["kind"] === "literal") {
    const literal = record["value"];
    return (
      literal === null ||
      typeof literal === "string" ||
      typeof literal === "number" ||
      typeof literal === "boolean"
    );
  }
  return record["kind"] === "ref" && typeof record["ref"] === "string";
}

/**
 * Резолвит операнд в runtime-значение.
 * Для `kind: "ref"` возвращает значение из контекста (в т.ч. `unloadedValue`).
 */
export function resolveSerializedOperand(
  operand: SerializedOperand,
  getContextValue: (ref: string) => unknown,
): unknown {
  if (operand.kind === "ref") {
    return getContextValue(operand.ref);
  }
  return operand.value;
}

/** Собирает context-path ссылки из одного операнда. */
export function collectSerializedOperandRefs(
  operand: SerializedOperand,
): string[] {
  return operand.kind === "ref" ? [operand.ref] : [];
}

/**
 * Собирает все context-path ссылки из payload условия
 * (`ref`, `value`, `length`, элементы массива `value` и вложенные условия).
 */
export function collectConditionPayloadRefs(payload: object): string[] {
  const record = payload as Record<string, unknown>;
  const refs: string[] = [];

  if (typeof record["ref"] === "string") {
    refs.push(record["ref"]);
  }

  if (isSerializedOperand(record["value"])) {
    refs.push(...collectSerializedOperandRefs(record["value"]));
  } else if (Array.isArray(record["value"])) {
    for (const item of record["value"]) {
      if (isSerializedOperand(item)) {
        refs.push(...collectSerializedOperandRefs(item));
      }
    }
  }

  if (isSerializedOperand(record["length"])) {
    refs.push(...collectSerializedOperandRefs(record["length"]));
  }

  if (Array.isArray(record["conditions"])) {
    for (const condition of record["conditions"]) {
      if (
        condition !== null &&
        typeof condition === "object" &&
        "payload" in condition &&
        condition.payload !== null &&
        typeof condition.payload === "object"
      ) {
        refs.push(...collectConditionPayloadRefs(condition.payload));
      }
    }
  }

  return refs;
}
