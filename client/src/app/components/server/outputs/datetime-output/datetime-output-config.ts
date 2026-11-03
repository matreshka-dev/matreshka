import type { DatetimeOutputConfig } from '@matreshka/client-bff-protocol/types/datetime-output-config';
import { OutputDependencies } from '../output-config';

export const DatetimeOutputDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...OutputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...OutputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...OutputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: DatetimeOutputConfig) =>
    OutputDependencies.getNestedConfigsPaths(config),
};
