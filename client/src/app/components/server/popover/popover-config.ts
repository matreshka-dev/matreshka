import type { PopoverConfig } from '@client-bff-protocol/types/popover-config';
import {
  ComponentDependencies,
  getNestedConfigsByPropertyKey,
  ServerComponentDependencies,
} from '../server-component-config';

export const PopoverDependencies: ComponentDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...ServerComponentDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: PopoverConfig) => [
    ...getNestedConfigsByPropertyKey(config, 'content'),
    ...ServerComponentDependencies.getNestedConfigsPaths(config),
  ],
};
