import { JsonObject } from "@matreshka/client-bff-protocol/types/json";
import { z } from "zod";
import { Context } from "./context";

type StripNullish<T> = Exclude<T, null | undefined>;

type ArrayElement<T> = T extends readonly (infer E)[] ? E : never;
/** `true`, если output допускает null/undefined как значение, а поле `T` — нет. */
type NullishValueMismatch<TField, IField> =
  | (null extends IField ? (null extends TField ? never : true) : never)
  | (undefined extends IField
      ? undefined extends TField
        ? never
        : true
      : never);

type FieldExtraSchemaKeysOne<TField, IField> = [StripNullish<IField>] extends [
  readonly unknown[],
]
  ? [StripNullish<TField>] extends [readonly unknown[]]
    ? ExtraSchemaKeys<
        ArrayElement<StripNullish<TField>>,
        ArrayElement<StripNullish<IField>>
      >
    : never
  : [StripNullish<IField>] extends [JsonObject]
    ? [StripNullish<TField>] extends [JsonObject]
      ? ExtraSchemaKeys<StripNullish<TField>, StripNullish<IField>>
      : never
    : never;

/** Лишние ключи внутри поля (union, optional/nullable, массивы объектов). */
type FieldExtraSchemaKeys<TField, IField> = IField extends any
  ? FieldExtraSchemaKeysOne<TField, IField>
  : never;

/** Лишние ключи для одной пары object-веток (коррелированные поля). `true` — есть лишние ключи. */
type ExtraSchemaKeysObjectExact<
  T extends JsonObject,
  Input extends JsonObject,
> =
  Exclude<keyof Input, keyof T> extends never
    ? {
        [K in keyof Input & keyof T]: FieldExtraSchemaKeys<T[K], Input[K]>;
      }[keyof Input & keyof T] extends never
      ? never
      : true
    : true;

/** Есть ветка `T`, для которой `Input` не содержит лишних ключей. */
type SomeExtraSchemaKeysBranchOk<
  T,
  Input extends JsonObject,
> = T extends JsonObject
  ? ExtraSchemaKeysObjectExact<T, Input> extends never
    ? true
    : never
  : never;

/**
 * Лишние ключи в shape схемы относительно `T` (рекурсивно).
 * Union в `Input` и `T` проверяется по отдельным веткам. `true` — есть лишние ключи.
 */
type ExtraSchemaKeys<T, Input> = Input extends JsonObject
  ? SomeExtraSchemaKeysBranchOk<T, Input> extends true
    ? never
    : true
  : never;

type FieldSchemaCompatibleOne<TField, IField> =
  NullishValueMismatch<TField, IField> extends never
    ? FieldSchemaCompatibleShape<TField, IField>
    : true;

type FieldSchemaCompatibleShape<TField, IField> = [
  StripNullish<IField>,
] extends [readonly unknown[]]
  ? [StripNullish<TField>] extends [readonly unknown[]]
    ? FieldSchemaCompatible<
        ArrayElement<StripNullish<TField>>,
        ArrayElement<StripNullish<IField>>
      >
    : true
  : [StripNullish<IField>] extends [JsonObject]
    ? [StripNullish<TField>] extends [JsonObject]
      ? SchemaCompatible<StripNullish<TField>, StripNullish<IField>>
      : true
    : [StripNullish<IField>] extends [StripNullish<TField>]
      ? never
      : true;

/** Совместимость типа поля с полем контекста (union на входе — по веткам). */
type FieldSchemaCompatible<TField, IField> = IField extends any
  ? FieldSchemaCompatibleOne<TField, IField>
  : never;

/** Совместимость для одной пары object-веток. `true` — несовместимость. */
type SchemaCompatibleObjectExact<
  T extends JsonObject,
  Input extends JsonObject,
> =
  Exclude<keyof Input, keyof T> extends never
    ? {
        [K in keyof Input & keyof T]: FieldSchemaCompatible<T[K], Input[K]>;
      }[keyof Input & keyof T] extends never
      ? never
      : true
    : true;

type SomeSchemaCompatibleBranchOk<
  T,
  Input extends JsonObject,
> = T extends JsonObject
  ? SchemaCompatibleObjectExact<T, Input> extends never
    ? true
    : never
  : never;

/**
 * Типы полей shape схемы совместимы с `T` (рекурсивно; для клиентской схемы — {@link z.output}).
 * Подмножество ключей на любой глубине; union — по веткам. `true` — несовместимость.
 */
type SchemaCompatible<T, Input> = Input extends JsonObject
  ? SomeSchemaCompatibleBranchOk<T, Input> extends true
    ? never
    : true
  : never;

type SchemaInputKeysSubset<T extends JsonObject, S extends z.ZodObject> =
  Exclude<keyof z.input<S>, keyof T> extends never ? true : false;

type DeepPartial<T> = T extends readonly (infer E)[]
  ? readonly DeepPartial<E>[]
  : T extends object
    ? { [K in keyof T]?: DeepPartial<T[K]> }
    : T;

type SchemaOutputCompatible<T extends JsonObject, S extends z.ZodObject> =
  z.output<S> extends DeepPartial<T> ? true : false;

/**
 * Zod-схема для {@link createContext}: без лишних ключей во {@link z.input} и {@link z.output}
 * ({@link ExtraSchemaKeys}, union по веткам); {@link z.output} совместим с `T`
 * ({@link SchemaCompatible}, вложенные подмножества). В контекст попадает output после `parse()`.
 */
export type ContextSchema<T extends JsonObject, S extends z.ZodObject> =
  SchemaOutputCompatible<T, S> extends false
    ? never
    : SchemaInputKeysSubset<T, S> extends false
      ? never
      : ExtraSchemaKeys<T, z.input<S>> extends never
        ? ExtraSchemaKeys<T, z.output<S>> extends never
          ? S
          : never
        : never;

/** Конфиг {@link createContext} без клиентской Zod-схемы. */
export type ContextInitWithoutSchema<T extends JsonObject> = {
  data: () => Promise<T>;
  schema?: undefined;
  preload?: boolean;
  persistent?: boolean;
};

/** Конфиг {@link createContext} с Zod-схемой клиентских изменений. */
export type ContextInitWithSchema<
  T extends JsonObject,
  S extends z.ZodObject,
> = {
  data: () => Promise<T>;
  schema: ContextSchema<T, S>;
  preload?: boolean;
  persistent?: boolean;
};

/** Конфигурация {@link createContext} (единственный аргумент). */
export type ContextInitConfig<
  T extends JsonObject,
  S extends z.ZodObject | undefined = undefined,
> = S extends z.ZodObject
  ? ContextInitWithSchema<T, S>
  : ContextInitWithoutSchema<T>;

/** Минимальная форма аргумента {@link createContext}. */
type ContextInitShape = {
  data: () => Promise<JsonObject>;
  schema?: z.ZodObject;
  preload?: boolean;
  persistent?: boolean;
};

/** Тип данных `T` из поля `data` конфига. */
export type ContextDataFromInit<C extends ContextInitShape> = Awaited<
  ReturnType<C["data"]>
>;

/** Zod-схема из поля `schema` конфига (или `undefined`). */
export type ContextSchemaFromInit<C extends ContextInitShape> = C extends {
  schema: z.ZodObject;
}
  ? C["schema"]
  : undefined;

/** Экземпляр {@link Context} по форме конфига {@link createContext}. */
export type ContextFromInit<C extends ContextInitShape> = Context<
  ContextDataFromInit<C>
>;

type ContextWithSchemaInit = {
  data: () => Promise<unknown>;
  schema: z.ZodObject;
  preload?: boolean;
  persistent?: boolean;
};

type ContextDataForSchema<C extends ContextWithSchemaInit> =
  Awaited<ReturnType<C["data"]>> extends infer T
    ? T extends JsonObject
      ? T
      : never
    : never;

type ContextCreateRuntimeInit<T extends JsonObject> = {
  data: () => Promise<T>;
  schema?: z.ZodObject;
  preload?: boolean;
  persistent?: boolean;
};

/**
 * Создаёт контекст данных BFF: хранилище состояния с синхронизацией клиент ↔ сервер.
 *
 * Тип данных выводится из `data`, тип Zod-схемы — из `schema`. Связь проверяется через
 * {@link ContextSchema}.
 *
 * Если в начальном `data` нет части полей (например опциональных), укажите тип на колбэке:
 * `data: async (): Promise<MyT> => ({ … })`.
 */
export function createContext<const C extends ContextWithSchemaInit>(
  config: C,
  ...validation: ContextSchema<
    ContextDataForSchema<C>,
    NoInfer<C["schema"]>
  > extends never
    ? [schemaMismatch: never]
    : []
): Context<ContextDataForSchema<C>>;
export function createContext<const T extends JsonObject>(
  config: ContextInitWithoutSchema<T>,
): Context<T>;
export function createContext<const T extends JsonObject>(
  config: ContextCreateRuntimeInit<T>,
  ..._validation: unknown[]
): Context<T> {
  return new Context<T>(config);
}
