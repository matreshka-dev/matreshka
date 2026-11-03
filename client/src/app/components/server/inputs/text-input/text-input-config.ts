import type { TextInputConfig } from '@matreshka/client-bff-protocol/types/text-input-config';
import { InputDependencies } from '../input-config';

export const TextInputDependencies = {
  pathsWithPlaceholdersInTemplate: [
    'placeholder',
    ...InputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...InputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...InputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: TextInputConfig) => [
    ...InputDependencies.getNestedConfigsPaths(config),
  ],
};
