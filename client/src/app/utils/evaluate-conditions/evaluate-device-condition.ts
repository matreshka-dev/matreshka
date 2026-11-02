import { ConditionType } from '@protocol/enums/condition-type';
import { DeviceType } from '@protocol/enums/device-type';
import type { Condition } from '@protocol/types/condition';

export function evaluateDeviceCondition(
  condition: Condition,
  getDeviceType?: () => DeviceType,
): boolean {
  if (!getDeviceType) {
    return false;
  }

  const deviceType = getDeviceType();
  switch (condition.type) {
    case ConditionType.MobileDevice:
      return deviceType === DeviceType.Mobile;
    case ConditionType.NotMobileDevice:
      return deviceType !== DeviceType.Mobile;
    case ConditionType.TabletDevice:
      return deviceType === DeviceType.Tablet;
    case ConditionType.NotTabletDevice:
      return deviceType !== DeviceType.Tablet;
    case ConditionType.DesktopDevice:
      return deviceType === DeviceType.Desktop;
    case ConditionType.NotDesktopDevice:
      return deviceType !== DeviceType.Desktop;
    default:
      return false;
  }
}
