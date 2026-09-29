import type { ComponentDependencies } from '../../components/server/server-component-config';
import { ServerComponentConfig } from '../../components/server/server-component-config';
import type { ComponentConfigStore } from './component-config-store';

type ServerComponentSettings = Record<
  string,
  { dependencies: ComponentDependencies }
>;

/**
 * Запускает interaction анимации (`animate-component`) у корня и потомков
 * (например hide при закрытии dialog до уничтожения DOM).
 */
export function animateSubtree(
  store: ComponentConfigStore,
  serverComponents: ServerComponentSettings,
  configId: string,
  type: string,
  options?: { skipRoot?: boolean },
): Promise<Animation[]> {
  const entry = store.getEntry(configId);
  if (!entry) {
    return Promise.resolve([]);
  }

  const runs: Promise<Animation[]>[] = [];
  const visit = (cfg: ServerComponentConfig) => {
    if (options?.skipRoot && cfg.id === configId) {
      serverComponents[cfg.class].dependencies
        .getNestedConfigsPaths(cfg)
        .forEach(visit);
      return;
    }
    if (hasAnimateInteraction(cfg, type)) {
      for (const instance of store.getInstances(cfg.id)) {
        runs.push(instance.animateInteraction(type));
      }
    }
    serverComponents[cfg.class].dependencies
      .getNestedConfigsPaths(cfg)
      .forEach(visit);
  };
  visit(entry.sourceConfig);

  if (runs.length === 0) {
    return Promise.resolve([]);
  }
  return Promise.all(runs).then((batches) => batches.flat());
}

/** Есть ли у конфига interaction нужного type с class animate-component. */
function hasAnimateInteraction(
  config: ServerComponentConfig,
  type: string,
): boolean {
  return (
    config.interactions?.[type]?.some(
      (interaction) => interaction.class === 'animate-component',
    ) ?? false
  );
}
