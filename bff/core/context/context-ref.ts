import { JsonObject } from "@matreshka/client-bff-protocol/types/json";
import { Observable } from "rxjs";
import { Paths, PathValue } from "ts-essentials";
import { z } from "zod";
import { ActionConfig } from "../actions/action";
import { decContextValue, DecContextValue } from "../actions/dec-context-value";
import { incContextValue, IncContextValue } from "../actions/inc-context-value";
import {
  createSetContext,
  LocalContextPathPatch,
  SetContext,
} from "../actions/set-context";
import {
  toggleContextValue,
  ToggleContextValue,
} from "../actions/toggle-context-value";
import { currentClient } from "../client-context";
import type { ContextUpdateDelivery } from "../types/context-update-delivery";
import {
  ValueOrContextRef,
  WritableContextRefOfValue,
} from "../types/context-value-ref";
import {
  Context,
  ContextPathPatch,
  WritableContextPath,
  WritablePathValue,
} from "./context";

type ContextRefLocalSet<
  ContextType extends JsonObject,
  PathType extends string,
  SchemaType extends z.ZodObject | undefined,
> =
  PathType extends WritableContextPath<ContextType, SchemaType>
    ? {
        set: (
          value: ValueOrContextRef<WritablePathValue<SchemaType, PathType>>,
          config?: ActionConfig,
        ) => SetContext<ContextType, SchemaType>;
      }
    : {};

type ContextRefLocalToggle = {
  toggle: (config?: ActionConfig) => ToggleContextValue;
};

type ContextRefLocalNumeric = {
  inc: (
    step?: ValueOrContextRef<number>,
    config?: ActionConfig,
  ) => IncContextValue;
  dec: (
    step?: ValueOrContextRef<number>,
    config?: ActionConfig,
  ) => DecContextValue;
};

/** Локальные действия по ref; `toggle` / `inc` / `dec` — по типу значения по пути. */
export type ContextRefLocalActions<
  ContextType extends JsonObject,
  PathType extends string,
  SchemaType extends z.ZodObject | undefined,
> = ContextRefLocalSet<ContextType, PathType, SchemaType> &
  (PathType extends WritableContextPath<ContextType, SchemaType>
    ? WritablePathValue<SchemaType, PathType> extends boolean | undefined
      ? ContextRefLocalToggle
      : {}
    : {}) &
  (PathType extends WritableContextPath<ContextType, SchemaType>
    ? WritablePathValue<SchemaType, PathType> extends number | undefined
      ? ContextRefLocalNumeric
      : {}
    : {});

export type AnySchemaContextRef<
  ContextType extends JsonObject = any,
  PathType extends string = any,
> =
  | ContextRef<ContextType, PathType, undefined>
  | ContextRef<ContextType, PathType, z.ZodObject>;

export type ContextRefValueType<R extends AnySchemaContextRef> = R extends {
  readonly __valueType?: infer ValueType;
}
  ? Exclude<ValueType, undefined>
  : R extends ContextRef<infer ContextType, infer PathType, any>
    ? PathValue<ContextType, PathType>
    : never;

export class ContextRef<
  ContextType extends JsonObject = JsonObject,
  PathType extends string = string,
  SchemaType extends z.ZodObject | undefined = any,
> {
  readonly __schemaType?: SchemaType;
  /** Локальные (client-only) действия по этому ref. */
  readonly local = {
    set: (
      value: ValueOrContextRef<PathValue<ContextType, PathType>>,
      config?: ActionConfig,
    ) => {
      const patch = {
        [this.path]: value,
      } as LocalContextPathPatch<ContextType, SchemaType>;
      return createSetContext(this.context, patch, config);
    },
    toggle: (config?: ActionConfig) =>
      toggleContextValue(
        this as unknown as WritableContextRefOfValue<boolean | undefined>,
        config,
      ),
    inc: (step: ValueOrContextRef<number> = 1, config?: ActionConfig) =>
      incContextValue(
        this as unknown as WritableContextRefOfValue<number | undefined>,
        step,
        config,
      ),
    dec: (step: ValueOrContextRef<number> = 1, config?: ActionConfig) =>
      decContextValue(
        this as unknown as WritableContextRefOfValue<number | undefined>,
        step,
        config,
      ),
  } as unknown as ContextRefLocalActions<ContextType, PathType, SchemaType>;

  constructor(
    readonly context: Context<ContextType, SchemaType>,
    readonly path: PathType,
  ) {}

  /**
   * Продолжение пути в рамках того же контекста.
   * Строго типизировано: K должен быть путём внутри значения по текущему PathType.
   */
  ref<K extends Paths<PathValue<ContextType, PathType>>>(
    path: K,
  ): ContextRef<ContextType, `${PathType}.${K}`, SchemaType>;
  /**
   * Продолжение пути, если передан другой ContextRef того же контекста.
   * В этом случае итоговый путь становится `${PathType}.${P2}`.
   */
  ref<P2 extends string, OtherSchemaType extends z.ZodObject | undefined>(
    path: ContextRef<ContextType, P2, OtherSchemaType>,
  ): ContextRef<ContextType, `${PathType}.${P2}`, SchemaType>;
  ref(
    path:
      | Paths<PathValue<ContextType, PathType>>
      | ContextRef<ContextType, string, z.ZodObject | undefined>,
  ): ContextRef<ContextType, any, SchemaType> {
    if (path instanceof ContextRef) {
      const fullPath = `${this.path}.${path.path}`;
      return new ContextRef<ContextType, string, SchemaType>(
        this.context,
        fullPath,
      );
    }
    const fullPath = `${this.path}.${path}`;
    return new ContextRef<ContextType, string, SchemaType>(
      this.context,
      fullPath,
    );
  }
  /**
   * Дописывает к текущему пути **плейсхолдер** второго контекста: строку вида
   * `@{<id контекста other>.<путь other>}` (через `other.toString()`), без подстановки
   * значения на момент вызова.
   *
   * При каждом чтении {@link Context.get} подставляет в эту строку актуальное значение по
   * ссылке `other` (тот же механизм, что и для обычных путей с плейсхолдерами).
   * Если во втором контексте меняется строка-сегмент пути или индекс, одна и та же
   * ссылка `ContextRef` продолжает указывать на корректные данные.
   *
   * По типам `other` ограничен путём во втором контексте (`Paths<OtherContextType>`),
   * в отличие от склейки через обычный `ref` со строкой.
   *
   * Пример: текущий контекст `{ cards: { balance: number }[] }`, база `cards`; во
   * втором контексте поле `segment` хранит строку `"1.balance"` (или `"0.balance"`).
   * Тогда `this.context.ref("cards").strictRef(other.ref("segment"))` даёт хранимый
   * путь с суффиксом-плейсхолдером; после резолва читается `cards.<индекс>.balance`.
   *
   * Для ссылки из **другого** экземпляра `Context` второй контекст должен быть известен
   * рантайму (как и для любых `@{…}`), например через синхронизацию с клиентом.
   *
   * @experimental
   */
  strictRef<
    OtherContextType extends JsonObject,
    OtherSchemaType extends z.ZodObject | undefined,
    OtherPathType extends Paths<OtherContextType>,
  >(
    other: ContextRef<OtherContextType, OtherPathType, OtherSchemaType>,
  ): ContextRef<
    ContextType,
    `${PathType}.${PathValue<OtherContextType, OtherPathType> & string}`,
    SchemaType
  > {
    const fullPath = `${this.path}.${other.toString()}`;
    return new ContextRef<
      ContextType,
      `${PathType}.${PathValue<OtherContextType, OtherPathType> & string}`,
      SchemaType
    >(
      this.context,
      fullPath as `${PathType}.${PathValue<OtherContextType, OtherPathType> &
        string}`,
    );
  }
  /** Значение по текущему пути (делегирует {@link Context.get}). */
  get(): PathValue<ContextType, PathType> {
    return (this.context.get as (p: string) => unknown)(this.path) as PathValue<
      ContextType,
      PathType
    >;
  }

  /**
   * Запись значения по текущему пути через {@link Context.set}.
   * Hot Observable стартует в момент вызова. Уничтоженный контекст —
   * та же ошибка, что у {@link Context.set}.
   */
  set(
    value: PathValue<ContextType, PathType>,
  ): Observable<ContextUpdateDelivery> {
    return this.context.set({
      [this.path]: value,
    } as unknown as ContextPathPatch<ContextType>);
  }

  toString() {
    return `@{${this.context.id}.${this.path}}`;
  }

  toJSON() {
    this.context.authorizeClient(currentClient());
    return `${this.context.id}.${this.path}`;
  }
}
