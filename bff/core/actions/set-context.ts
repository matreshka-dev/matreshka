import { JsonObject } from "@matreshka/client-bff-protocol/types/json";
import {
  toSerializedOperand,
  UntypedActionOperand,
} from "../conditions/condition-operand";
import { Context, ContextPathPatch } from "../context/context";
import { ValueOrContextRef } from "../types/context-value-ref";
import { ActionConfig } from "./action";
import { LocalAction } from "./local-action";

export type LocalContextPathPatch<T extends JsonObject> = Partial<{
  [K in keyof ContextPathPatch<T>]: ValueOrContextRef<ContextPathPatch<T>[K]>;
}>;

/**
 * Локальная запись patch в Context на клиенте (с sync на BFF через `context-values`).
 */
export class SetContext<T extends JsonObject> extends LocalAction {
  constructor(
    private readonly context: Context<T>,
    private readonly patch: LocalContextPathPatch<T>,
    config: ActionConfig = {},
  ) {
    super(config.conditions);
  }

  class(): string {
    return "set-context";
  }

  payload(): object {
    return {
      context: this.context.id,
      patch: Object.fromEntries(
        Object.entries(this.patch).map(([key, value]) => [
          key,
          toSerializedOperand(value as UntypedActionOperand),
        ]),
      ),
    };
  }
}

/** @internal */
export function createSetContext<T extends JsonObject>(
  context: Context<T>,
  patch: LocalContextPathPatch<T>,
  config: ActionConfig = {},
): SetContext<T> {
  return new SetContext(context, patch, config);
}
