import type { QrCodeConfig } from '@shared/types/qr-code-config';
import { OutputDependencies } from '../output-config';

export const QrCodeDependencies = {
  pathsWithPlaceholdersInTemplate: [
    'value',
    ...OutputDependencies.pathsWithPlaceholdersInTemplate,
  ],
  pathsWithPlaceholdersInCode: [
    ...OutputDependencies.pathsWithPlaceholdersInCode,
  ],
  requiredContextsPaths: [...OutputDependencies.requiredContextsPaths],
  getNestedConfigsPaths: (config: QrCodeConfig) =>
    OutputDependencies.getNestedConfigsPaths(config),
};
