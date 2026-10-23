import { toSerializedOperand } from "../conditions/condition-operand";
import { ContextValueOrRef } from "../types/context-value-ref";
import { ActionConfig } from "./action";
import { NumberValueRef } from "./inc-context-value";
import { LocalAction } from "./local-action";

/**
 * Уменьшение числового значения в Context на клиенте на `step`
 * (с sync на BFF через `context-values`).
 */
export class DecContextValue extends LocalAction {
  constructor(
    private readonly ref: NumberValueRef,
    private readonly step: ContextValueOrRef<number>,
    config: ActionConfig = {},
  ) {
    super(config.conditions);
  }

  class(): string {
    return "dec-context-value";
  }

  payload(): object {
    return {
      ref: this.ref,
      step: toSerializedOperand(this.step),
    };
  }
}

/**
 * Функциональная форма {@link DecContextValue}.
 * Принимает только `ContextRef` с числовым значением.
 * Без `step` клиент вычитает 1.
 */
export function decContextValue(
  ref: NumberValueRef,
  step: ContextValueOrRef<number> = 1,
  config: ActionConfig = {},
): DecContextValue {
  return new DecContextValue(ref, step, config);
}
