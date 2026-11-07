import { ContextRef, ContextRefValueType } from "../context/context-ref";

/**
 * Ссылка на поле контекста с известным типом значения.
 *
 * Контекст и путь не фиксируются — важен только тип значения по ref.
 * Удобно в сигнатурах компонентов и хелперов, которые не обращаются к вложенным
 * полям по типизированному пути.
 *
 * @example
 * ```ts
 * function bindAmount(ref: ContextRefOfValue<number | undefined>) {
 *   ref.get(); // number | undefined
 * }
 *
 * bindAmount(pageContext.ref("amount"));
 * ```
 */
export type ContextRefOfValue<ValueType> = ContextRef<any, any> & {
  readonly __valueType?: ValueType;
  get(): ValueType;
  set(value: ValueType): void;
};

/**
 * Ref `R` совместим с ожидаемым типом значения `ValueType` (проверка на call site).
 */
export type CompatibleContextRefOfValue<ValueType, R extends ContextRef> =
  ValueType extends ContextRefValueType<R> ? R : never;

/** Статическое значение или ссылка на совместимое значение в контексте. */
export type ValueOrContextRef<ValueType> =
  | ValueType
  | ContextRefOfValue<Exclude<ValueType, undefined>>;

/**
 * Ссылка на массив элементов в контексте (`ItemType[] | undefined`).
 *
 * Generic задаёт тип **элемента**, как в {@link CompatibleForEachRef} / `forEach`.
 */
export type ContextArrayValueRef<ItemType> = ContextRefOfValue<
  ItemType[] | undefined
>;
