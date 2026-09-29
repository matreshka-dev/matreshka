import type { MapConfig } from '@shared/types/map-config';
import {
  ComponentDependencies,
  getNestedConfigsByPropertyKey,
  ServerComponentDependencies,
} from '../server-component-config';

export const MapDependencies: ComponentDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...ServerComponentDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: MapConfig) => {
    return [
      ...getNestedConfigsByPropertyKey(config, 'markers', (value) =>
        Array.isArray(value)
          ? value.map((marker) =>
              typeof marker === 'object' &&
              marker !== null &&
              'component' in marker
                ? (marker as { component: unknown }).component
                : undefined,
            )
          : [],
      ),
      ...ServerComponentDependencies.getNestedConfigsPaths(config),
    ];
  },
};
