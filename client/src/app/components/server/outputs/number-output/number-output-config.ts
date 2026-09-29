import type { NumberOutputConfig } from '@shared/types/number-output-config';
import { OutputDependencies } from '../output-config';

export const NumberOutputDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...OutputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...OutputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...OutputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: NumberOutputConfig) =>
    OutputDependencies.getNestedConfigsPaths(config),
};
