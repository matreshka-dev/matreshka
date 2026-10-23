import { tryCurrentEntry } from "../entry-context";
import type { Componentable } from "../types/componentable";
import { ActionConfig } from "./action";
import { LocalAction } from "./local-action";

/**
 * Локальное закрытие entry (dialog / popover) на клиенте без round-trip на BFF.
 * {@link target} в payload — instance id entry при сериализации внутри entry.
 */
export class CloseEntry extends LocalAction {
  constructor(
    private readonly entry: Componentable,
    config: ActionConfig = {},
  ) {
    super(config.conditions);
  }

  class(): string {
    return "close-entry";
  }

  payload(): object {
    return {
      target: this.resolveTarget(),
    };
  }

  private resolveTarget(): string {
    const currentEntry = tryCurrentEntry();
    if (currentEntry !== undefined && currentEntry.component === this.entry) {
      return currentEntry.id;
    }
    return this.entry.id;
  }
}

export function closeEntry(
  entry: Componentable,
  config: ActionConfig = {},
): CloseEntry {
  return new CloseEntry(entry, config);
}
