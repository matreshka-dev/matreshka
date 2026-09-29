import type { ContainerConfig } from '@shared/types/container-config';
import {
  ComponentDependencies,
  getNestedConfigsByPropertyKey,
  ServerComponentDependencies,
} from '../server-component-config';

export const ContainerDependencies: ComponentDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...ServerComponentDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: ContainerConfig) => [
    ...getNestedConfigsByPropertyKey(config, 'content'),
    ...ServerComponentDependencies.getNestedConfigsPaths(config),
  ],
};
