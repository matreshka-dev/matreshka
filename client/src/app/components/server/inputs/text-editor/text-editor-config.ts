import type { TextEditorConfig } from '@shared/types/text-editor-config';
import { InputDependencies } from '../input-config';

export const TextEditorDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...InputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...InputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...InputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: TextEditorConfig) => [
    ...InputDependencies.getNestedConfigsPaths(config),
  ],
};
