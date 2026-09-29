import type { ImageOutputConfig } from '@shared/types/image-output-config';
import { OutputDependencies } from '../output-config';

export const ImageOutputDependencies = {
  pathsWithPlaceholdersInTemplate: [
    'value',
    ...OutputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...OutputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...OutputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: ImageOutputConfig) =>
    OutputDependencies.getNestedConfigsPaths(config),
};
