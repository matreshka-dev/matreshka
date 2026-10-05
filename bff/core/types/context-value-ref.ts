import { ContextRef, ContextRefValue } from "../context/context-ref";

/**
 * Ссылка на поле контекста с известным типом значения.
 *
 * Контекст и путь не фиксируются — важен только тип значения по ref.
 * Удобно в сигнатурах компонентов и хелперов, которые не обращаются к вложенным
 * полям по типизированному пути.
 *
 * @example
 * ```ts
 * function bindAmount(ref: ContextValueRef<number | undefined>) {
 *   ref.value(); // number | undefined
 * }
 *
 * bindAmount(pageContext.ref("amount"));
 * ```
 */
export type ContextValueRef<ValueType> = ContextRef<any, any> & {
  readonly __valueType?: ValueType;
  value(): ValueType;
  setValue(value: ValueType): void;
};

/**
 * Ref `R` совместим с ожидаемым типом значения `ValueType` (проверка на call site).
 */
export type CompatibleContextValueRef<ValueType, R extends ContextRef> =
  ValueType extends ContextRefValue<R> ? R : never;

/**
 * Ссылка на массив элементов в контексте (`ItemType[] | undefined`).
 *
 * Generic задаёт тип **элемента**, как в {@link CompatibleForEachRef} / `forEach`.
 */
export type ContextArrayRef<ItemType> = ContextValueRef<ItemType[] | undefined>;
