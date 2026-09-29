import type { ChartConfig } from '@shared/types/chart-config';
import {
  ComponentDependencies,
  ServerComponentDependencies,
} from '../server-component-config';

export const ChartDependencies: ComponentDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...ServerComponentDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: ChartConfig) =>
    ServerComponentDependencies.getNestedConfigsPaths(config),
};
