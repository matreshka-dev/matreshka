import { JsonObject } from "@matreshka/shared/types/json";
import { Observable } from "rxjs";
import { Paths, PathValue } from "ts-essentials";
import { ActionConfig } from "../actions/action";
import { decContextValue, DecContextValue } from "../actions/dec-context-value";
import {
  incContextValue,
  IncContextValue,
  NumberValueRef,
} from "../actions/inc-context-value";
import {
  createSetContext,
  LocalContextPathPatch,
  SetContext,
} from "../actions/set-context";
import {
  BooleanValueRef,
  toggleContextValue,
  ToggleContextValue,
} from "../actions/toggle-context-value";
import { currentClient } from "../client-context";
import type { ContextUpdateDelivery } from "../types/context-update-delivery";
import { ContextValueOrRef } from "../types/context-value-ref";
import { Context } from "./context";

type ContextRefLocalSet<
  ContextType extends JsonObject,
  PathType extends string,
> = {
  set: (
    value: ContextValueOrRef<PathValue<ContextType, PathType>>,
    config?: ActionConfig,
  ) => SetContext<ContextType>;
};

type ContextRefLocalToggle = {
  toggle: (config?: ActionConfig) => ToggleContextValue;
};

type ContextRefLocalNumeric = {
  inc: (
    step?: ContextValueOrRef<number>,
    config?: ActionConfig,
  ) => IncContextValue;
  dec: (
    step?: ContextValueOrRef<number>,
    config?: ActionConfig,
  ) => DecContextValue;
};

/** Локальные действия по ref; `toggle` / `inc` / `dec` — по типу значения по пути. */
export type ContextRefLocalActions<
  ContextType extends JsonObject,
  PathType extends string,
> = ContextRefLocalSet<ContextType, PathType> &
  (PathValue<ContextType, PathType> extends boolean | undefined
    ? ContextRefLocalToggle
    : {}) &
  (PathValue<ContextType, PathType> extends number | undefined
    ? ContextRefLocalNumeric
    : {});

export type ContextRefValue<R extends ContextRef> = R extends {
  readonly __valueType?: infer ValueType;
}
  ? Exclude<ValueType, undefined>
  : R extends ContextRef<infer ContextType, infer PathType>
    ? PathValue<ContextType, PathType>
    : never;

export class ContextRef<
  ContextType extends JsonObject = JsonObject,
  PathType extends string = string,
> {
  /** Локальные (client-only) действия по этому ref. */
  readonly local = {
    set: (
      value: ContextValueOrRef<PathValue<ContextType, PathType>>,
      config?: ActionConfig,
    ) => {
      const patch = {
        [this.path]: value,
      } as unknown as LocalContextPathPatch<ContextType>;
      return createSetContext(
        this.context as Context<ContextType>,
        patch,
        config,
      );
    },
    toggle: (config?: ActionConfig) =>
      toggleContextValue(this as BooleanValueRef, config),
    inc: (step: ContextValueOrRef<number> = 1, config?: ActionConfig) =>
      incContextValue(this as NumberValueRef, step, config),
    dec: (step: ContextValueOrRef<number> = 1, config?: ActionConfig) =>
      decContextValue(this as NumberValueRef, step, config),
  } as ContextRefLocalActions<ContextType, PathType>;

  constructor(
    readonly context: Context<any>,
    readonly path: PathType,
  ) {}

  /**
   * Продолжение пути в рамках того же контекста.
   * Строго типизировано: K должен быть путём внутри значения по текущему PathType.
   */
  ref<K extends Paths<PathValue<ContextType, PathType>>>(
    path: K,
  ): ContextRef<ContextType, `${PathType}.${K}`>;
  /**
   * Продолжение пути, если передан другой ContextRef того же контекста.
   * В этом случае итоговый путь становится `${PathType}.${P2}`.
   */
  ref<P2 extends string>(
    path: ContextRef<ContextType, P2>,
  ): ContextRef<ContextType, `${PathType}.${P2}`>;
  ref(
    path:
      | Paths<PathValue<ContextType, PathType>>
      | ContextRef<ContextType, string>,
  ): ContextRef<ContextType, any> {
    if (path instanceof ContextRef) {
      const fullPath = `${this.path}.${path.path}`;
      return new ContextRef<ContextType, string>(this.context, fullPath);
    }
    const fullPath = `${this.path}.${path}`;
    return new ContextRef<ContextType, string>(this.context, fullPath);
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
    OtherPathType extends Paths<OtherContextType>,
  >(
    other: ContextRef<OtherContextType, OtherPathType>,
  ): ContextRef<
    ContextType,
    `${PathType}.${PathValue<OtherContextType, OtherPathType> & string}`
  > {
    const fullPath = `${this.path}.${other.toString()}`;
    return new ContextRef<
      ContextType,
      `${PathType}.${PathValue<OtherContextType, OtherPathType> & string}`
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
    });
  }

  toString() {
    return `@{${this.context.id}.${this.path}}`;
  }

  toJSON() {
    this.context.authorizeClient(currentClient());
    return `${this.context.id}.${this.path}`;
  }
}
