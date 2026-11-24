import { toSerializedOperand } from "../conditions/condition-operand";
import {
  ContextRefOfValue,
  ValueOrContextRef,
  WritableContextRefOfValue,
} from "../types/context-value-ref";
import {
  ContextLocalActionConfig,
  contextLocalSyncField,
} from "./context-local-action-config";
import { LocalAction } from "./local-action";

/** Ref на числовое поле контекста. */
export type NumberValueRef = ContextRefOfValue<number | undefined>;

/**
 * Изменение числового значения в Context на клиенте на `step`.
 * По умолчанию синхронизируется на BFF через `context-values`.
 * `config.sync: false` оставляет значение только в клиентском зеркале.
 */
export class IncContextValue extends LocalAction {
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
    return "inc-context-value";
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
 * Функциональная форма {@link IncContextValue}.
 * Принимает только `ContextRef` с числовым значением.
 * Без `step` клиент прибавляет 1.
 */
export function incContextValue(
  ref: WritableContextRefOfValue<number | undefined>,
  step: ValueOrContextRef<number> = 1,
  config: ContextLocalActionConfig = {},
): IncContextValue {
  return new IncContextValue(ref, step, config);
}
