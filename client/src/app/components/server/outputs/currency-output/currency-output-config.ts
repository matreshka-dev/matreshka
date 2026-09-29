import type { CurrencyOutputConfig } from '@shared/types/currency-output-config';
import { OutputDependencies } from '../output-config';

export const CurrencyOutputDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...OutputDependencies.pathsWithPlaceholdersInTemplate,
    'currency',
  ],
  pathsWithPlaceholdersInCode: [
    ...OutputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...OutputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: CurrencyOutputConfig) =>
    OutputDependencies.getNestedConfigsPaths(config),
};
