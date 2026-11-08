import type { JsonObject } from "@matreshka/client-bff-protocol/types/json";
import type { Observable } from "rxjs";
import { z } from "zod";
import type { SetContext } from "../actions/set-context";
import { Context, WritableContextPath } from "../context/context";
import {
  AnySchemaContextRef,
  ContextRef,
  ContextRefValueType,
} from "../context/context-ref";
import type { ContextUpdateDelivery } from "./context-update-delivery";

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
export type ContextRefOfValue<ValueType> = ContextRef<any, any, any> & {
  readonly __valueType?: ValueType;
  get(): ValueType;
  set(value: ValueType): void;
  toString(): string;
  toJSON(): string;
};

/**
 * Ref `R` совместим с ожидаемым типом значения `ValueType` (проверка на call site).
 */
export type CompatibleContextRefOfValue<
  ValueType,
  R extends AnySchemaContextRef,
> = ValueType extends ContextRefValueType<R> ? R : never;

/** Ref `R` указывает на путь, разрешённый для клиентской записи по schema. */
export type WritableContextRef<R extends AnySchemaContextRef> =
  R extends ContextRef<infer ContextType, infer PathType, infer SchemaType>
    ? PathType extends string
      ? PathType extends WritableContextPath<ContextType, SchemaType>
        ? R
        : never
      : never
    : never;

/** Ref `R` совместим по значению и одновременно writable по schema. */
export type CompatibleWritableContextRefOfValue<
  ValueType,
  R extends AnySchemaContextRef,
> = WritableContextRef<CompatibleContextRefOfValue<ValueType, R>>;

/**
 * Эталонный writable ref для значения `ValueType`: путь `k` гарантированно есть
 * в schema. Из него выводится `local`, так что при добавлении
 * методов в `ContextRef.local` типы вручную переписывать не нужно.
 */
type WritableReferenceRef<ValueType> = ContextRef<
  { k: Exclude<ValueType, undefined> } extends infer C extends JsonObject
    ? C
    : never,
  "k",
  z.ZodObject<{
    k: z.ZodType<Exclude<ValueType, undefined>, Exclude<ValueType, undefined>>;
  }>
>;

/**
 * Стирает привязку `SetContext` к конкретному контексту/schema, остальные
 * сигнатуры `local` остаются как у `ContextRef.local`.
 */
type EraseLocalContext<Local> = {
  [K in keyof Local]: Local[K] extends (...args: infer Args) => infer Result
    ? Result extends SetContext<any, any>
      ? (...args: Args) => SetContext<any, any>
      : Local[K]
    : Local[K];
};

/**
 * Writable-ref с известным типом значения без generic по ref.
 *
 * Принадлежность пути schema проверяется брендом `__notWritable` (`undefined`
 * только для путей из `WritableContextPath`), а `local` берётся из `ContextRef.local`
 * для эталонного writable ref, поэтому ref с путём вне schema не пройдёт
 * проверку на call site.
 *
 * @example
 * ```ts
 * function setTrue(ref: WritableContextRefOfValue<boolean | undefined>) {
 *   ref.local.set(true);
 *   ref.local.toggle();
 * }
 * ```
 */
export type WritableContextRefOfValue<ValueType> = {
  readonly context: Context<any, any>;
  readonly path: string;
  readonly __valueType?: ValueType;
  get(): ValueType;
  set(value: ValueType): Observable<ContextUpdateDelivery>;
  toString(): string;
  toJSON(): string;
  readonly local: EraseLocalContext<WritableReferenceRef<ValueType>["local"]>;
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
