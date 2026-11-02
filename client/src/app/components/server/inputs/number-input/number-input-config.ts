import type { NumberInputConfig } from '@protocol/types/number-input-config';
import { InputDependencies } from '../input-config';

export const NumberInputDependencies = {
  pathsWithPlaceholdersInTemplate: [
    'placeholder',
    ...InputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...InputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...InputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: NumberInputConfig) => [
    ...InputDependencies.getNestedConfigsPaths(config),
  ],
};
