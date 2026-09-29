import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { Condition } from "./condition";

/**
 * Условие: устройство клиента не планшет.
 *
 * @internal Используйте {@link notTabletDevice} / {@link device.notTablet}.
 */
export class NotTabletDevice extends Condition {
  constructor() {
    super(ConditionType.NotTabletDevice);
  }
}

/** Функциональная форма {@link NotTabletDevice}. */
export function notTabletDevice(): NotTabletDevice {
  return new NotTabletDevice();
}
