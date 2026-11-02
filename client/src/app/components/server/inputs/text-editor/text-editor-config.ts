import type { TextEditorConfig } from '@protocol/types/text-editor-config';
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
