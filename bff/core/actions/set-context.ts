import { JsonObject } from "@matreshka/client-bff-protocol/types/json";
import { Paths, PathValue } from "ts-essentials";
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
import {
  ContextLocalActionConfig,
  contextLocalSyncField,
} from "./context-local-action-config";
import { LocalAction } from "./local-action";

export type LocalContextPathPatch<
  T extends JsonObject,
  S extends z.ZodObject | undefined,
> = Partial<{
  [K in WritableContextPath<T, S>]: ValueOrContextRef<WritablePathValue<S, K>>;
}>;

/** Patch по любому пути данных. Для `sync: false`, без проверки схемы. */
export type LocalDataPathPatch<T extends JsonObject> = Partial<{
  [K in Paths<T>]: ValueOrContextRef<PathValue<T, K>>;
}>;

/**
 * Локальная запись patch в Context на клиенте.
 * По умолчанию синхронизируется на BFF через `context-values`.
 * `config.sync: false` оставляет значение только в клиентском зеркале.
 */
export class SetContext<
  T extends JsonObject,
  S extends z.ZodObject | undefined,
> extends LocalAction {
  private readonly sync: boolean | undefined;

  constructor(
    private readonly context: Context<T, S>,
    private readonly patch: LocalDataPathPatch<T>,
    config: ContextLocalActionConfig = {},
  ) {
    super(config.conditions);
    this.sync = config.sync;
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
      ...contextLocalSyncField(this.sync),
    };
  }
}

/** @internal */
export function createSetContext<
  T extends JsonObject,
  S extends z.ZodObject | undefined,
>(
  context: Context<T, S>,
  patch: LocalDataPathPatch<T>,
  config: ContextLocalActionConfig = {},
): SetContext<T, S> {
  return new SetContext(context, patch, config);
}
