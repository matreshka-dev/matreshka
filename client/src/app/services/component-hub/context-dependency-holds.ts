import type { ContextHubService } from '../context-hub.service';
import type { PathContextDependency } from './component-config-entry.types';

/** Все contextId из графа зависимостей одного ConfigEntry (ref, rules, плейсхолдеры). */
export function extractContextIds(
  contextDependencies: Map<string, PathContextDependency[]>,
): Set<string> {
  const ids = new Set<string>();
  contextDependencies.forEach((deps) => {
    deps.forEach((dep) => {
      ids.add(dep.contextId);
    });
  });
  return ids;
}

export function diffContextIdSets(
  prev: Set<string>,
  next: Set<string>,
): { added: string[]; removed: string[] } {
  const added: string[] = [];
  const removed: string[] = [];
  next.forEach((id) => {
    if (!prev.has(id)) {
      added.push(id);
    }
  });
  prev.forEach((id) => {
    if (!next.has(id)) {
      removed.push(id);
    }
  });
  return { added, removed };
}

/** Синхронизирует retain/release в hub при смене набора contextId у entry. */
export function syncContextHolds(
  contextHub: Pick<ContextHubService, 'retain' | 'release'>,
  prev: Set<string>,
  next: Set<string>,
): void {
  const { added, removed } = diffContextIdSets(prev, next);
  removed.forEach((id) => contextHub.release(id));
  added.forEach((id) => contextHub.retain(id));
}
