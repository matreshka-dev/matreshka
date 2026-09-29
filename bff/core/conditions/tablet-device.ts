import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { Condition } from "./condition";

/**
 * Условие: устройство клиента — планшет.
 *
 * @internal Используйте {@link tabletDevice} / {@link device.tablet}.
 */
export class TabletDevice extends Condition {
  constructor() {
    super(ConditionType.TabletDevice);
  }
}

/** Функциональная форма {@link TabletDevice}. */
export function tabletDevice(): TabletDevice {
  return new TabletDevice();
}
