import type { IconConfig } from '@client-bff-protocol/types/icon-config';
import { OutputDependencies } from '../output-config';

export const IconDependencies = {
  pathsWithPlaceholdersInTemplate: [
    'value',
    ...OutputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...OutputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...OutputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: IconConfig) =>
    OutputDependencies.getNestedConfigsPaths(config),
};
