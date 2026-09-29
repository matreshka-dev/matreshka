import { AsyncLocalStorage } from "node:async_hooks";
import type { EntryComponent } from "../components";
import type { Client } from "./client";
import type { ComponentInstance } from "./types/component-instance";

const entryStorage = new AsyncLocalStorage<ComponentInstance<EntryComponent>>();

/** Instance entry-компонента, внутри сериализации дерева которого выполняется код. */
export function currentEntry(): ComponentInstance<EntryComponent> {
  const entry = entryStorage.getStore();
  if (!entry) {
    throw new Error(
      "currentEntry() only within EntryComponent.serialize() stack",
    );
  }
  return entry;
}

/** @internal */
export function tryCurrentEntry():
  | ComponentInstance<EntryComponent>
  | undefined {
  return entryStorage.getStore();
}

/** @internal */
export function runWithEntry<T>(
  entry: ComponentInstance<EntryComponent>,
  fn: () => T,
): T {
  return entryStorage.run(entry, fn);
}

/**
 * Сериализация в контексте entry instance; для глобальных App-оверлеев — {@link Client.ensureAppOverlayEntry}.
 * @internal
 */
export function runWithEntryContext<T>(
  entry: ComponentInstance<EntryComponent> | undefined,
  client: Client,
  fn: () => T,
): T {
  return runWithEntry(entry ?? client.ensureAppOverlayEntry(), fn);
}
