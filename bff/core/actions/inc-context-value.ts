import { toSerializedOperand } from "../conditions/condition-operand";
import { ContextValueOrRef, ContextValueRef } from "../types/context-value-ref";
import { ActionConfig } from "./action";
import { LocalAction } from "./local-action";

/** Ref на числовое поле контекста. */
export type NumberValueRef = ContextValueRef<number | undefined>;

/**
 * Изменение числового значения в Context на клиенте на `step`
 * (с sync на BFF через `context-values`).
 */
export class IncContextValue extends LocalAction {
  constructor(
    private readonly ref: NumberValueRef,
    private readonly step: ContextValueOrRef<number>,
    config: ActionConfig = {},
  ) {
    super(config.conditions);
  }

  class(): string {
    return "inc-context-value";
  }

  payload(): object {
    return {
      ref: this.ref,
      step: toSerializedOperand(this.step),
    };
  }
}

/**
 * Функциональная форма {@link IncContextValue}.
 * Принимает только `ContextRef` с числовым значением.
 * Без `step` клиент прибавляет 1.
 */
export function incContextValue(
  ref: NumberValueRef,
  step: ContextValueOrRef<number> = 1,
  config: ActionConfig = {},
): IncContextValue {
  return new IncContextValue(ref, step, config);
}
