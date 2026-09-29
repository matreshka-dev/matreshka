import type { IframeConfig } from '@shared/types/iframe-config';
import { OutputDependencies } from '../output-config';

export const IframeDependencies = {
  pathsWithPlaceholdersInTemplate: [
    'value',
    ...OutputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...OutputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...OutputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: IframeConfig) =>
    OutputDependencies.getNestedConfigsPaths(config),
};
