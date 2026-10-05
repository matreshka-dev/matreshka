import type { JsonPrimitive } from "@matreshka/shared/types/json";
import type { SerializedOperand } from "@matreshka/shared/types/serialized-operand";
import { ContextRef } from "../context/context-ref";
import type { ContextRefPrimitiveValue } from "../types/context-ref-primitive-value";

/**
 * Операнд условия на BFF: литерал того же примитивного типа, что значение по `ref`,
 * либо другая `ContextRef` (сравнение в рантайме через `===`).
 */
export type ConditionOperand<R extends ContextRef> =
  | ContextRefPrimitiveValue<R>
  | ContextRef;

/** Операнд без привязки к конкретному `ref` (например, поле элемента массива). */
export type UntypedConditionOperand = JsonPrimitive | ContextRef;

/** Операнд длины массива: число или ссылка на число в контексте. */
export type ConditionLengthOperand = number | ContextRef;

/**
 * До JSON-сериализации в `kind: "ref"` лежит `ContextRef`;
 * после stringify `ref` становится строкой `contextId.path`.
 */
export type BffSerializedOperand =
  | { kind: "literal"; value: JsonPrimitive }
  | { kind: "ref"; ref: ContextRef };

export function toSerializedOperand(
  value: UntypedConditionOperand,
): BffSerializedOperand {
  if (value instanceof ContextRef) {
    return { kind: "ref", ref: value };
  }
  return { kind: "literal", value };
}

/** Для payload, который уходит в `Condition` и затем кастится к wire-типу. */
export function toWireOperand(
  value: UntypedConditionOperand,
): SerializedOperand {
  return toSerializedOperand(value) as unknown as SerializedOperand;
}
