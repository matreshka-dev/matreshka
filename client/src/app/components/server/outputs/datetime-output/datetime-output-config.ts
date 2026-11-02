import type { DatetimeOutputConfig } from '@protocol/types/datetime-output-config';
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
