import type { GridConfig } from '@shared/types/grid-config';
import {
  ComponentDependencies,
  getNestedConfigsByPropertyKey,
  ServerComponentDependencies,
} from '../server-component-config';

export const GridDependencies: ComponentDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...ServerComponentDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: GridConfig) => [
    ...getNestedConfigsByPropertyKey(config, 'content'),
    ...ServerComponentDependencies.getNestedConfigsPaths(config),
  ],
};
