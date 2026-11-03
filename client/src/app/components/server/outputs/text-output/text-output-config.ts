import type { TextOutputConfig } from '@matreshka/client-bff-protocol/types/text-output-config';
import { OutputDependencies } from '../output-config';

export const TextOutputDependencies = {
  pathsWithPlaceholdersInTemplate: [
    'value',
    ...OutputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...OutputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...OutputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: TextOutputConfig) =>
    OutputDependencies.getNestedConfigsPaths(config),
};
