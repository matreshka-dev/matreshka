import type { ProgressBarConfig } from '@shared/types/progress-bar-config';
import { OutputDependencies } from '../output-config';

export const ProgressBarDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...OutputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...OutputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...OutputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: ProgressBarConfig) =>
    OutputDependencies.getNestedConfigsPaths(config),
};
