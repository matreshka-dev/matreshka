import type { ComponentHubService } from '../../../services/component-hub.service';
import type { ServerComponentConfig } from '../server-component-config';

/** Первый вложенный server-компонент в content; иначе fallback (хост с display:contents). */
export function renderRootFromFirstNestedInstance(
  hub: ComponentHubService,
  content: ServerComponentConfig[] | undefined,
  fallback: HTMLElement,
): HTMLElement {
  const nestedId = content?.[0]?.id;
  if (!nestedId) {
    return fallback;
  }
  const instances = hub.getInstances(nestedId);
  if (instances.length === 0) {
    return fallback;
  }
  return instances[0].renderRoot();
}
