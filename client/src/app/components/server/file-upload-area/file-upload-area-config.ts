import type { FileUploadAreaConfig } from '@client-bff-protocol/types/file-upload-area-config';
import {
  getNestedConfigsByPropertyKey,
  ServerComponentDependencies,
} from '../server-component-config';

export const FileUploadAreaDependencies = {
  pathsWithPlaceholdersInTemplate: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...ServerComponentDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...ServerComponentDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: FileUploadAreaConfig) => {
    return [
      ...getNestedConfigsByPropertyKey(config, 'content'),
      ...ServerComponentDependencies.getNestedConfigsPaths(config),
    ];
  },
};
