import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { Condition } from "./condition";

/**
 * Условие: устройство клиента — мобильный телефон.
 *
 * @internal Используйте {@link mobileDevice} / {@link device.mobile}.
 */
export class MobileDevice extends Condition {
  constructor() {
    super(ConditionType.MobileDevice);
  }
}

/** Функциональная форма {@link MobileDevice}. */
export function mobileDevice(): MobileDevice {
  return new MobileDevice();
}
