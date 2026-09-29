import type { PasswordInputConfig } from '@shared/types/password-input-config';
import { InputDependencies } from '../input-config';

export const PasswordInputDependencies = {
  pathsWithPlaceholdersInTemplate: [
    'placeholder',
    ...InputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...InputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...InputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: PasswordInputConfig) => [
    ...InputDependencies.getNestedConfigsPaths(config),
  ],
};
