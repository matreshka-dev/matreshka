import { JsonObject } from "@matreshka/shared/types/json";
import { Paths, PathValue } from "ts-essentials";
import { currentClient } from "../client-context";
import { Context } from "./context";

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
   * При каждом чтении `Context.value` подставляет в эту строку актуальное значение по
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
  // Строгое значение по текущему пути
  value(): PathValue<ContextType, PathType> {
    // Явно выбираем перегрузку Context.value(string): unknown и приводим к ожидаемому типу
    return (this.context.value as (p: string) => unknown)(
      this.path,
    ) as PathValue<ContextType, PathType>;
  }

  /**
   * Запись значения по текущему пути через {@link Context.setValue}.
   * Если контекст уже уничтожен, вызов игнорируется (без исключения).
   */
  setValue(value: PathValue<ContextType, PathType>): void {
    if (this.context.isDestroyed()) {
      return;
    }
    (
      this.context.setValue as (
        path: PathType,
        value: PathValue<ContextType, PathType>,
      ) => void
    )(this.path, value);
  }

  toString() {
    return `@{${this.context.id}.${this.path}}`;
  }

  toJSON() {
    this.context.authorizeClient(currentClient());
    return `${this.context.id}.${this.path}`;
  }
}
