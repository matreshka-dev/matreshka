import type { TextareaConfig } from '@matreshka/client-bff-protocol/types/textarea-config';
import { InputDependencies } from '../input-config';

export const TextareaDependencies = {
  pathsWithPlaceholdersInTemplate: [
    'placeholder',
    ...InputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...InputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...InputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: TextareaConfig) => [
    ...InputDependencies.getNestedConfigsPaths(config),
  ],
};
