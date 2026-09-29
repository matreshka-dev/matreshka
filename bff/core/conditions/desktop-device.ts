import { ConditionType } from "@matreshka/shared/enums/condition-type";
import { Condition } from "./condition";

/**
 * Условие: устройство клиента — десктоп.
 *
 * @internal Используйте {@link desktopDevice} / {@link device.desktop}.
 */
export class DesktopDevice extends Condition {
  constructor() {
    super(ConditionType.DesktopDevice);
  }
}

/** Функциональная форма {@link DesktopDevice}. */
export function desktopDevice(): DesktopDevice {
  return new DesktopDevice();
}
