import type { JsonObject, JsonPrimitive } from "@matreshka/shared/types/json";
import type { SerializedOperand } from "@matreshka/shared/types/serialized-operand";
import { Paths, PathValue } from "ts-essentials";
import { ContextRef, ContextRefValue } from "../context/context-ref";
import type { CompatibleContextValueRef } from "../types/context-value-ref";

type ContextArrayValue = readonly unknown[] | unknown[];

/** Элемент массива по значению `ContextRef`. */
export type ContextRefArrayElement<R extends ContextRef> = Extract<
  ContextRefValue<R>,
  ContextArrayValue
>[number];

/** Ref на массив в контексте (значение по ref — массив или readonly-массив). */
export type CompatibleArrayContextRef<R extends ContextRef> = [
  Extract<ContextRefValue<R>, ContextArrayValue>,
] extends [never]
  ? never
  : R;

/**
 * Операнд сравнения по известному типу значения: JSON-примитив или совместимая `ContextRef`.
 *
 * Ref-операнд: {@link CompatibleContextValueRef} с `ContextRef<any, any>` (item-ref из `forEach`
 * и ref из другого контекста). Без `| undefined` у ValueType — иначе `(T | undefined) extends T`
 * отсекает ref↔ref сравнения.
 */
export type ConditionOperandFor<ValueType> =
  | (ValueType & JsonPrimitive)
  | CompatibleContextValueRef<ValueType, ContextRef<any, any>>; // Пришлось оставить <any, any>, без этого ругается на типы в условиях

/**
 * Операнд условия на BFF: JSON-примитив того же типа, что значение по `ref`,
 * либо другая ссылка с совместимым типом значения (сравнение в рантайме через `===`).
 */
export type ConditionOperand<R extends ContextRef> = ConditionOperandFor<
  ContextRefValue<R>
>;

/** Значение поля элемента массива по `itemPath` (пустой путь — сам элемент). */
export type ArrayIncludesItemValue<Item, P extends string> = P extends ""
  ? Item
  : Item extends JsonObject
    ? PathValue<Item, P & Paths<Item>>
    : never;

/** Операнд {@link ContextArrayIncludes} / {@link ContextArrayNotIncludes}. */
export type ArrayIncludesOperand<
  R extends ContextRef,
  P extends string,
> = ConditionOperandFor<ArrayIncludesItemValue<ContextRefArrayElement<R>, P>>;

/** Операнд длины массива: число или ссылка на число в контексте. */
export type ConditionLengthOperand = ConditionOperandFor<number>;

/** Операнд без привязки к конкретному `ref` (сериализация на wire). */
export type UntypedConditionOperand = JsonPrimitive | ContextRef;

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
