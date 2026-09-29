import type { DialogConfig } from '@shared/types/dialog-config';
import {
  ComponentDependencies,
  getNestedConfigsByPropertyKey,
  ServerComponentDependencies,
} from '../server-component-config';

export const DialogDependencies: ComponentDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...ServerComponentDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: DialogConfig) => {
    return [
      ...getNestedConfigsByPropertyKey(config, 'content'),
      ...ServerComponentDependencies.getNestedConfigsPaths(config),
    ];
  },
};
