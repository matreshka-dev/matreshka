import { PopoverPositionArea } from "../enums/popover-position-area";
import { ServerComponentClass } from "../enums/server-component-class";
import type { EntryServerComponentConfig } from "./entry-server-component-config";
import type {
  EntryServerComponentProperties,
  ServerComponentConfig,
} from "./server-component-config";

/**
 * Для popover поле `size` из {@link EntryServerComponentProperties} трактуется как ширина:
 * значение > 1 — px, от 0 до 1 — доля ширины якоря.
 */
export interface PopoverConfigProperties
  extends EntryServerComponentProperties {
  content: ServerComponentConfig[];
  /**
   * CSS `position-area` относительно якоря.
   * Если в show-popover передан `anchor` — якорь с `anchor-name`; иначе implicit anchor от source.
   */
  positionArea?: PopoverPositionArea;
}

export type PopoverConfig = Omit<
  EntryServerComponentConfig,
  "class" | "properties"
> & {
  class: ServerComponentClass.Popover;
  properties: PopoverConfigProperties;
};
