import type { FilePickerConfig } from '@matreshka/client-bff-protocol/types/file-picker-config';
import {
  getNestedConfigsByPropertyKey,
  ServerComponentDependencies,
} from '../server-component-config';

export const FilePickerDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...ServerComponentDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: FilePickerConfig) => {
    return [
      ...getNestedConfigsByPropertyKey(config, 'content'),
      ...ServerComponentDependencies.getNestedConfigsPaths(config),
    ];
  },
};
