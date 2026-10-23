import { JsonObject } from "@matreshka/shared/types/json";
import { Context, ContextPathPatch } from "../context/context";
import { ActionConfig } from "./action";
import { LocalAction } from "./local-action";

/**
 * Локальная запись patch в Context на клиенте (с sync на BFF через `context-values`).
 */
export class SetContext<T extends JsonObject> extends LocalAction {
  constructor(
    private readonly context: Context<T>,
    private readonly patch: ContextPathPatch<T>,
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
      patch: this.patch,
    };
  }
}

/** @internal */
export function createSetContext<T extends JsonObject>(
  context: Context<T>,
  patch: ContextPathPatch<T>,
  config: ActionConfig = {},
): SetContext<T> {
  return new SetContext(context, patch, config);
}
