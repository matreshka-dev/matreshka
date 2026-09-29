import { AsyncLocalStorage } from "node:async_hooks";
import type { ComponentInstance } from "../types/component-instance";

const createdInstancesStorage = new AsyncLocalStorage<ComponentInstance[]>();

/**
 * Выполняет код и возвращает instances, созданные внутри через {@link Component.createInstance}.
 */
export function runWithCreatedInstanceTracking<T>(fn: () => T): {
  result: T;
  instances: ComponentInstance[];
} {
  const created: ComponentInstance[] = [];
  const result = createdInstancesStorage.run(created, fn);
  return { result, instances: [...created] };
}

/** @internal */
export function trackCreatedInstance(instance: ComponentInstance): void {
  createdInstancesStorage.getStore()?.push(instance);
}
