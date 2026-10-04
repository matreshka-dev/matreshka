import { ContextValueRef } from "../types/context-value-ref";
import { ActionConfig } from "./action";
import { LocalAction } from "./local-action";

/** Ref на boolean-поле контекста. */
export type BooleanValueRef = ContextValueRef<boolean | undefined>;
/**
 * Инверсия boolean-значения в Context на клиенте (с sync на BFF через `context-values`).
 */
export class ToggleContextValue extends LocalAction {
  constructor(
    private readonly ref: BooleanValueRef,
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
export function toggleContextValue(
  ref: BooleanValueRef,
  config: ActionConfig = {},
): ToggleContextValue {
  return new ToggleContextValue(ref, config);
}
