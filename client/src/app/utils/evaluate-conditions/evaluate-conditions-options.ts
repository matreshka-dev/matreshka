import { DeviceType } from '@matreshka/client-bff-protocol/enums/device-type';

export type EvaluateConditionsOptions = {
  getContextValue: (ref: string) => unknown;
  getDeviceType?: () => DeviceType;
  unloadedValue?: unknown;
};
