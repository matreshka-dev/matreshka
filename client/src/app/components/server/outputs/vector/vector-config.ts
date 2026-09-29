import type { VectorConfig } from '@shared/types/vector-config';
import { OutputDependencies } from '../output-config';

export const VectorDependencies = {
  pathsWithPlaceholdersInTemplate: [
    'value',
    ...OutputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...OutputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...OutputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: VectorConfig) =>
    OutputDependencies.getNestedConfigsPaths(config),
};
