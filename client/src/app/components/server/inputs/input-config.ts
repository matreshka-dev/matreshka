import {
  ComponentDependencies,
  ServerComponentDependencies,
} from '../server-component-config';

export const InputDependencies: ComponentDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    'ref',
    ...ServerComponentDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [
    'ref',
    ...ServerComponentDependencies.requiredContextsPaths,
  ],
  getNestedConfigsPaths: (config) =>
    ServerComponentDependencies.getNestedConfigsPaths(config),
};
