import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { Condition } from "./condition";

/**
 * Условие: устройство клиента не десктоп.
 *
 * @internal Используйте {@link notDesktopDevice} / {@link device.notDesktop}.
 */
export class NotDesktopDevice extends Condition {
  constructor() {
    super(ConditionType.NotDesktopDevice);
  }
}

/** Функциональная форма {@link NotDesktopDevice}. */
export function notDesktopDevice(): NotDesktopDevice {
  return new NotDesktopDevice();
}
