import { toSerializedOperand } from "../conditions/condition-operand";
import {
  ValueOrContextRef,
  WritableContextRefOfValue,
} from "../types/context-value-ref";
import {
  ContextLocalActionConfig,
  contextLocalSyncField,
} from "./context-local-action-config";
import { NumberValueRef } from "./inc-context-value";
import { LocalAction } from "./local-action";

/**
 * Уменьшение числового значения в Context на клиенте на `step`.
 * По умолчанию синхронизируется на BFF через `context-values`.
 * `config.sync: false` оставляет значение только в клиентском зеркале.
 */
export class DecContextValue extends LocalAction {
  private readonly sync: boolean | undefined;

  constructor(
    private readonly ref: NumberValueRef,
    private readonly step: ValueOrContextRef<number>,
    config: ContextLocalActionConfig = {},
  ) {
    super(config.conditions);
    this.sync = config.sync;
  }

  class(): string {
    return "dec-context-value";
  }

  payload(): object {
    return {
      ref: this.ref,
      step: toSerializedOperand(this.step),
      ...contextLocalSyncField(this.sync),
    };
  }
}

/**
 * Функциональная форма {@link DecContextValue}.
 * Принимает только `ContextRef` с числовым значением.
 * Без `step` клиент вычитает 1.
 */
export function decContextValue(
  ref: WritableContextRefOfValue<number | undefined>,
  step: ValueOrContextRef<number> = 1,
  config: ContextLocalActionConfig = {},
): DecContextValue {
  return new DecContextValue(ref, step, config);
}
