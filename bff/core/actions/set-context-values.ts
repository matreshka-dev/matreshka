import { ContextRef, ContextRefValue } from "../context/context-ref";
import { ActionConfig } from "./action";
import { LocalAction } from "./local-action";

/**
 * Пара ref + value для batch-записи в Context.
 * Тип `value` выводится из конкретного `ref`.
 */
export type ContextValueAssignment<
  R extends ContextRef<any, any> = ContextRef<any, any>,
> = {
  ref: R;
  value: ContextRefValue<R>;
};

type AssertContextValueAssignments<T extends readonly unknown[]> = {
  [K in keyof T]: T[K] extends { ref: infer R extends ContextRef<any, any> }
    ? ContextValueAssignment<R>
    : never;
};

/**
 * Batch-запись значений в Context на клиенте (с sync на BFF через `context-values`).
 */
export class SetContextValues extends LocalAction {
  constructor(
    private readonly values: readonly ContextValueAssignment[],
    config: ActionConfig = {},
  ) {
    super(config.conditions);
  }

  class(): string {
    return "set-context-values";
  }

  payload(): object {
    return {
      values: this.values.map(({ ref, value }) => ({ ref, value })),
    };
  }
}

/**
 * Функциональная форма {@link SetContextValues}.
 * У каждого элемента массива тип `value` должен совпадать с типом значения по `ref`.
 */
export function setContextValues<
  const T extends readonly [
    ContextValueAssignment,
    ...ContextValueAssignment[],
  ],
>(
  values: AssertContextValueAssignments<T> & T,
  config: ActionConfig = {},
): SetContextValues {
  return new SetContextValues(values, config);
}
