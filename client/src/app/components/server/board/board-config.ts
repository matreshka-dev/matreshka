import type { BoardConfig } from '@shared/types/board-config';
import {
  ComponentDependencies,
  getNestedConfigsByPropertyKey,
  ServerComponentDependencies,
} from '../server-component-config';

export const BoardDependencies: ComponentDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...ServerComponentDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: BoardConfig) => {
    return [
      ...getNestedConfigsByPropertyKey(config, 'items', (value) =>
        Array.isArray(value)
          ? value.map((item) =>
              typeof item === 'object' && item !== null && 'component' in item
                ? (item as { component: unknown }).component
                : undefined,
            )
          : [],
      ),
      ...ServerComponentDependencies.getNestedConfigsPaths(config),
    ];
  },
};
