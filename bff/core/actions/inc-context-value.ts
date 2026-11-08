import { toSerializedOperand } from "../conditions/condition-operand";
import {
  ContextRefOfValue,
  ValueOrContextRef,
  WritableContextRefOfValue,
} from "../types/context-value-ref";
import { ActionConfig } from "./action";
import { LocalAction } from "./local-action";

/** Ref на числовое поле контекста. */
export type NumberValueRef = ContextRefOfValue<number | undefined>;

/**
 * Изменение числового значения в Context на клиенте на `step`
 * (с sync на BFF через `context-values`).
 */
export class IncContextValue extends LocalAction {
  constructor(
    private readonly ref: NumberValueRef,
    private readonly step: ValueOrContextRef<number>,
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
  ref: WritableContextRefOfValue<number | undefined>,
  step: ValueOrContextRef<number> = 1,
  config: ActionConfig = {},
): IncContextValue {
  return new IncContextValue(ref as unknown as NumberValueRef, step, config);
}
