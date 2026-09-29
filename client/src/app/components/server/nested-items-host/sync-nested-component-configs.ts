import type { ServerComponentConfig } from '@shared/types/server-component-config';
import type { NestedItemsDiff } from '@shared/utils/diff-nested-items';
import type { ComponentHubService } from '../../../services/component-hub.service';
import {
  reverseComponentAnimations,
  selectAnimationsToReverse,
} from '../utils/run-component-animations';

export type SyncNestedComponentHubsOptions = {
  entryId: string;
  previousItems: readonly { id: string; component: ServerComponentConfig }[];
  nextItems: readonly { id: string; component: ServerComponentConfig }[];
  diff: NestedItemsDiff<{ id: string; component: ServerComponentConfig }>;
  componentHub: ComponentHubService;
  listSyncGeneration: { value: number };
  hasHideAnimation: (config: ServerComponentConfig) => boolean;
  runHideAnimation: (config: ServerComponentConfig) => Promise<void>;
};

/** Hub lifecycle при NestedItemsSync: register / freeze / unfreeze / delete. */
export function syncNestedComponentHubs(
  options: SyncNestedComponentHubsOptions,
): void {
  const {
    entryId,
    previousItems,
    nextItems,
    diff,
    componentHub,
    listSyncGeneration,
    hasHideAnimation,
    runHideAnimation,
  } = options;
  const generation = ++listSyncGeneration.value;
  const nextComponentIds = new Set(nextItems.map((item) => item.component.id));
  const previousComponents = previousItems.map((item) => item.component);
  const removed = diff.removed.map((item) => item.component);
  const deferredRemoved = removed.filter((component) =>
    hasHideAnimation(component),
  );
  const deferredRemovedIds = new Set(
    deferredRemoved.map((component) => component.id),
  );

  for (const component of previousComponents) {
    if (nextComponentIds.has(component.id)) {
      componentHub.unfreezeConfigSubtree(component);
      reverseInFlightHideIfRestored(component, componentHub);
    }
  }
  for (const component of deferredRemoved) {
    componentHub.freezeConfigSubtree(component);
  }

  const registerNextConfigs = () => {
    for (const item of nextItems) {
      componentHub.registerConfig(item.component, entryId);
    }
  };

  const deleteRemovedConfigs = (configIds: Set<string>) => {
    for (const component of previousComponents) {
      if (configIds.has(component.id)) {
        componentHub.deleteConfig(component);
      }
    }
  };

  if (deferredRemovedIds.size === 0) {
    registerNextConfigs();
    deleteRemovedConfigs(
      new Set(
        previousComponents
          .filter((component) => !nextComponentIds.has(component.id))
          .map((component) => component.id),
      ),
    );
    return;
  }

  for (const component of previousComponents) {
    if (deferredRemovedIds.has(component.id)) {
      continue;
    }
    if (!nextComponentIds.has(component.id)) {
      componentHub.deleteConfig(component);
    }
  }

  void Promise.all(
    deferredRemoved.map((component) => runHideAnimation(component)),
  ).then(() => {
    if (generation !== listSyncGeneration.value) {
      return;
    }
    registerNextConfigs();
    deleteRemovedConfigs(deferredRemovedIds);
  });
}

function reverseInFlightHideIfRestored(
  config: ServerComponentConfig,
  componentHub: ComponentHubService,
): void {
  const instances = componentHub.getInstances(config.id);
  if (instances.length === 0) {
    return;
  }
  const element = instances[0].animationElement();
  const toReverse = selectAnimationsToReverse(element, true);
  if (toReverse.length > 0) {
    void reverseComponentAnimations(toReverse);
  }
}
