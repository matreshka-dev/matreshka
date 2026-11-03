import type { ProgressSpinnerConfig } from '@matreshka/client-bff-protocol/types/progress-spinner-config';
import { OutputDependencies } from '../output-config';

export const ProgressSpinnerDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...OutputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...OutputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...OutputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: ProgressSpinnerConfig) =>
    OutputDependencies.getNestedConfigsPaths(config),
};
