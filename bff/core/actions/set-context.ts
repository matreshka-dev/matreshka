import { JsonObject } from "@matreshka/client-bff-protocol/types/json";
import { z } from "zod";
import {
  toSerializedOperand,
  UntypedActionOperand,
} from "../conditions/condition-operand";
import {
  Context,
  WritableContextPath,
  WritablePathValue,
} from "../context/context";
import { ValueOrContextRef } from "../types/context-value-ref";
import { ActionConfig } from "./action";
import { LocalAction } from "./local-action";

export type LocalContextPathPatch<
  T extends JsonObject,
  S extends z.ZodObject | undefined,
> = Partial<{
  [K in WritableContextPath<T, S>]: ValueOrContextRef<WritablePathValue<S, K>>;
}>;

/**
 * Локальная запись patch в Context на клиенте (с sync на BFF через `context-values`).
 */
export class SetContext<
  T extends JsonObject,
  S extends z.ZodObject | undefined,
> extends LocalAction {
  constructor(
    private readonly context: Context<T, S>,
    private readonly patch: LocalContextPathPatch<T, S>,
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
export function createSetContext<
  T extends JsonObject,
  S extends z.ZodObject | undefined,
>(
  context: Context<T, S>,
  patch: LocalContextPathPatch<T, S>,
  config: ActionConfig = {},
): SetContext<T, S> {
  return new SetContext(context, patch, config);
}
