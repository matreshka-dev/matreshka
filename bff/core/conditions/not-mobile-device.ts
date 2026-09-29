import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { Condition } from "./condition";

/**
 * Условие: устройство клиента не мобильный телефон.
 *
 * @internal Используйте {@link notMobileDevice} / {@link device.notMobile}.
 */
export class NotMobileDevice extends Condition {
  constructor() {
    super(ConditionType.NotMobileDevice);
  }
}

/** Функциональная форма {@link NotMobileDevice}. */
export function notMobileDevice(): NotMobileDevice {
  return new NotMobileDevice();
}
