import { ContextRef, ContextRefValue } from "../context/context-ref";
import { ActionConfig } from "./action";
import { LocalAction } from "./local-action";

/**
 * Запись одного значения в Context на клиенте (с sync на BFF через `context-values`).
 */
export class SetContextValue extends LocalAction {
  constructor(
    private readonly ref: ContextRef<any, any>,
    private readonly value: unknown,
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
export function setContextValue<R extends ContextRef<any, any>>(
  ref: R,
  value: ContextRefValue<R>,
  config: ActionConfig = {},
): SetContextValue {
  return new SetContextValue(ref, value, config);
}
