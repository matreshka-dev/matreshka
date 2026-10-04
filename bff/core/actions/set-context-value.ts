import { ContextRefValue } from "../context/context-ref";
import { ContextValueRef } from "../types/context-value-ref";
import { ActionConfig } from "./action";
import { LocalAction } from "./local-action";

/**
 * Запись одного значения в Context на клиенте (с sync на BFF через `context-values`).
 *
 * `R` — конкретный ref; `value` имеет тип значения по этому ref.
 */
export class SetContextValue<
  R extends ContextValueRef<unknown>,
> extends LocalAction {
  constructor(
    private readonly ref: R,
    private readonly value: ContextRefValue<R>,
    config: ActionConfig = {},
  ) {
    super(config.conditions);
  }

  class(): string {
    return "set-context-value";
  }

  payload(): object {
    return {
      ref: this.ref,
      value: this.value,
    };
  }
}

/**
 * Функциональная форма {@link SetContextValue}.
 * Тип `value` должен совпадать с типом значения по `ref`.
 */
export function setContextValue<R extends ContextValueRef<unknown>>(
  ref: R,
  value: ContextRefValue<R>,
  config: ActionConfig = {},
): SetContextValue<R> {
  return new SetContextValue(ref, value, config);
}
