import {
  ContextRefOfValue,
  WritableContextRefOfValue,
} from "../types/context-value-ref";
import {
  ContextLocalActionConfig,
  contextLocalSyncField,
} from "./context-local-action-config";
import { LocalAction } from "./local-action";

/** Ref на boolean-поле контекста. */
export type BooleanValueRef = ContextRefOfValue<boolean | undefined>;
/**
 * Инверсия boolean-значения в Context на клиенте.
 * По умолчанию синхронизируется на BFF через `context-values`.
 * `config.sync: false` оставляет значение только в клиентском зеркале.
 */
export class ToggleContextValue extends LocalAction {
  private readonly sync: boolean | undefined;

  constructor(
    private readonly ref: BooleanValueRef,
    config: ContextLocalActionConfig = {},
  ) {
    super(config.conditions);
    this.sync = config.sync;
  }

  class(): string {
    return "toggle-context-value";
  }

  payload(): object {
    return {
      ref: this.ref,
      ...contextLocalSyncField(this.sync),
    };
  }
}

/**
 * Функциональная форма {@link ToggleContextValue}.
 * Принимает только `ContextRef` с boolean-значением.
 */
export function toggleContextValue(
  ref: WritableContextRefOfValue<boolean | undefined>,
  config: ContextLocalActionConfig = {},
): ToggleContextValue {
  return new ToggleContextValue(ref, config);
}
