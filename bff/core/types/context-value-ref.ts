import type { Observable } from "rxjs";
import type { ContextLocalActionConfig } from "../actions/context-local-action-config";
import type { DecContextValue } from "../actions/dec-context-value";
import type { IncContextValue } from "../actions/inc-context-value";
import type { SetContext } from "../actions/set-context";
import type { ToggleContextValue } from "../actions/toggle-context-value";
import {
  AnySchemaContextRef,
  ContextRef,
  ContextRefValueType,
} from "../context/context-ref";
import type { ContextUpdateDelivery } from "./context-update-delivery";

/** Общая часть ref-типов по значению: маркер типа, чтение и запись. */
type ValueRefBase<ValueType> = {
  readonly __valueType?: ValueType;
  get(): ValueType;
  set(value: ValueType): Observable<ContextUpdateDelivery>;
  update(
    updater: (current: ValueType) => ValueType,
  ): Observable<ContextUpdateDelivery>;
};

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
export type ContextRefOfValue<ValueType> = ValueRefBase<ValueType> &
  ContextRef<any, any, any>;
// & с ContextRef без Omit дает дополнительные лишние перегрузки get/set/update, которые не вызываются, но позволяют считать ContextRefOfValue совемстимым с ContextRef, что упрощает типизацию

/**
 * Ref `R` совместим с ожидаемым типом значения `ValueType` (проверка на call site).
 */
export type CompatibleContextRefOfValue<
  ValueType,
  R extends AnySchemaContextRef,
> = ValueType extends ContextRefValueType<R> ? R : never;

/**
 * Writable-ref с известным типом значения без generic по ref.
 *
 * `local.set` с optional config — sync-on ветка; ref с путём вне schema
 * (только `sync: false`) на call site не пройдёт.
 *
 * @example
 * ```ts
 * function setTrue(ref: WritableContextRefOfValue<boolean | undefined>) {
 *   ref.local.set(true);
 *   ref.local.toggle();
 * }
 * ```
 */
type WritableLocalByValue<ValueType> = {
  set(
    value: ValueOrContextRef<Exclude<ValueType, undefined>>,
    config?: ContextLocalActionConfig & { sync?: true },
  ): SetContext<any, any>;
} & ([Exclude<ValueType, undefined>] extends [boolean]
  ? {
      toggle(
        config?: ContextLocalActionConfig & { sync?: true },
      ): ToggleContextValue;
    }
  : // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- пересечение без toggle
    {}) &
  ([Exclude<ValueType, undefined>] extends [number]
    ? {
        inc(
          step?: ValueOrContextRef<number>,
          config?: ContextLocalActionConfig & { sync?: true },
        ): IncContextValue;
        dec(
          step?: ValueOrContextRef<number>,
          config?: ContextLocalActionConfig & { sync?: true },
        ): DecContextValue;
      }
    : // eslint-disable-next-line @typescript-eslint/no-empty-object-type -- пересечение без inc/dec
      {});

export type WritableContextRefOfValue<ValueType> =
  ContextRefOfValue<ValueType> & {
    readonly local: WritableLocalByValue<ValueType>;
  };

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
