import type { ComponentInstance } from "../core/types/component-instance";
import type { Componentable } from "../core/types/componentable";

/** Server-компонент или его инстанс на клиенте — аргумент showPopover в роли source и/или anchor. */
export type PopoverShowComponent = ComponentInstance | Componentable;

/** Раздельные source и визуальный anchor. */
export type PopoverShowPlacement = {
  anchor: PopoverShowComponent;
  source: PopoverShowComponent;
};

export function isPopoverShowPlacement(
  value: PopoverShowComponent | PopoverShowPlacement,
): value is PopoverShowPlacement {
  return (
    typeof value === "object" &&
    value !== null &&
    "anchor" in value &&
    "source" in value &&
    !("component" in value)
  );
}
