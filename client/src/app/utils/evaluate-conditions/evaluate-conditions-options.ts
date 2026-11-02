import { DeviceType } from '@client-bff-protocol/enums/device-type';

export type EvaluateConditionsOptions = {
  getContextValue: (ref: string) => unknown;
  getDeviceType?: () => DeviceType;
  unloadedValue?: unknown;
};
