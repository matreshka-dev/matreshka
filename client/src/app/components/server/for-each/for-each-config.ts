import type {
  ForEachConfig,
  ForEachSyncComponentsPayload,
} from '@matreshka/client-bff-protocol/types/for-each-config';
import {
  ComponentDependencies,
  getNestedConfigsByPropertyKey,
  ServerComponentDependencies,
} from '../server-component-config';

function forEachRowComponents(value: unknown): unknown[] {
  if (!value || typeof value !== 'object' || !('upserts' in value)) {
    return [];
  }
  return (value as ForEachSyncComponentsPayload).upserts.flatMap(
    (item) => item.components,
  );
}

export const ForEachDependencies: ComponentDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    'ref',
    ...ServerComponentDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [
    'componentContext',
    'ref',
    ...ServerComponentDependencies.requiredContextsPaths,
  ],
  getNestedConfigsPaths: (config: ForEachConfig) => [
    ...getNestedConfigsByPropertyKey(
      config,
      'components',
      forEachRowComponents,
    ),
    ...getNestedConfigsByPropertyKey(config, 'divider'),
    ...ServerComponentDependencies.getNestedConfigsPaths(config),
  ],
};
