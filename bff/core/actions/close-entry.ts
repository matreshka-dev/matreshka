import type { Componentable } from "../types/componentable";
import { ActionConfig } from "./action";
import { LocalAction } from "./local-action";

/**
 * Локальное закрытие entry (dialog / popover) на клиенте без round-trip на BFF.
 * {@link target} в payload — явный instance id или базовый id компонента.
 */
export class CloseEntry extends LocalAction {
  constructor(
    private readonly entry: Componentable,
    config: ActionConfig = {},
    private readonly target: string = entry.id,
  ) {
    super(config.conditions);
  }

  class(): string {
    return "close-entry";
  }

  payload(): object {
    return {
      target: this.target,
    };
  }
}

export function closeEntry(
  entry: Componentable,
  config: ActionConfig = {},
  target: string = entry.id,
): CloseEntry {
  return new CloseEntry(entry, config, target);
}
