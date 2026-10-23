import type { ContextHubService } from '../../../services/context-hub.service';
import { parseContextPath } from '../../../utils/parse-context-path';

export type ContextValueUpdate = { ref: string; value: unknown };

/**
 * Применяет обновления Context на клиенте через ContextHub.setValues
 * (локальная запись + sync на BFF сообщением `context-values`).
 */
export function applyContextValueUpdates(
  contextHub: ContextHubService,
  updates: readonly ContextValueUpdate[],
): void {
  const byContext = new Map<string, { key: string; value: unknown }[]>();

  for (const update of updates) {
    // Как в server-input: ключ с плейсхолдерами forEach (`devices.@{….index}.status`)
    // нужно раскрыть до записи, иначе значение уйдёт в литеральный путь,
    // а rules/conditions читают уже resolved-путь.
    const { contextId, key } = parseContextPath(
      contextHub.replacePlaceholders(update.ref),
    );
    const list = byContext.get(contextId) ?? [];
    list.push({ key, value: update.value });
    byContext.set(contextId, list);
  }

  for (const [contextId, data] of byContext) {
    contextHub.setValues(contextId, data);
  }
}

/**
 * Применяет patch одного Context на клиенте (LocalAction `set-context`).
 */
export function applyContextPatch(
  contextHub: ContextHubService,
  contextId: string,
  patch: Record<string, unknown>,
): void {
  const data: { key: string; value: unknown }[] = [];

  for (const key of Object.keys(patch)) {
    if (!Object.prototype.hasOwnProperty.call(patch, key)) {
      continue;
    }
    const resolvedKey = contextHub.replacePlaceholders(key);
    data.push({ key: resolvedKey, value: patch[key] });
  }

  if (data.length > 0) {
    contextHub.setValues(contextId, data);
  }
}
