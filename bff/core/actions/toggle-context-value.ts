import { ContextRef, ContextRefValue } from "../context/context-ref";
import { ActionConfig } from "./action";
import { LocalAction } from "./local-action";

/**
 * `ContextRef`, значение которого — `boolean` (допустимо `boolean | undefined`).
 */
export type BooleanContextRef<R extends ContextRef<any, any>> =
  Exclude<ContextRefValue<R>, undefined> extends boolean ? R : never;

/**
 * Инверсия boolean-значения в Context на клиенте (с sync на BFF через `context-values`).
 */
export class ToggleContextValue extends LocalAction {
  constructor(
    private readonly ref: ContextRef<any, any>,
    config: ActionConfig = {},
  ) {
    super(config.conditions);
  }

  class(): string {
    return "toggle-context-value";
  }

  payload(): object {
    return {
      ref: this.ref,
    };
  }
}

/**
 * Функциональная форма {@link ToggleContextValue}.
 * Принимает только `ContextRef` с boolean-значением.
 */
export function toggleContextValue<R extends ContextRef<any, any>>(
  ref: BooleanContextRef<R>,
  config: ActionConfig = {},
): ToggleContextValue {
  return new ToggleContextValue(ref, config);
}
