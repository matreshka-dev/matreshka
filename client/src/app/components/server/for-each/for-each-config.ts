import type { ForEachConfig } from '@shared/types/for-each-config';
import {
  ComponentDependencies,
  getNestedConfigsByPropertyKey,
  ServerComponentDependencies,
} from '../server-component-config';

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
    ...getNestedConfigsByPropertyKey(config, 'components'),
    ...getNestedConfigsByPropertyKey(config, 'divider'),
    ...ServerComponentDependencies.getNestedConfigsPaths(config),
  ],
};
