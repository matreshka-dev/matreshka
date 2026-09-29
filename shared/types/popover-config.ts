import { PopoverPositionArea } from "../enums/popover-position-area";
import { ServerComponentClass } from "../enums/server-component-class";
import type { Overlay } from "./container-overlay";
import type { ServerComponentConfig } from "./server-component-config";

export type PopoverConfig = {
  class: ServerComponentClass.Popover;
  properties: {
    content: ServerComponentConfig[];
    /** CSS `position-area` относительно якоря (`anchor-name` на триггере). */
    positionArea?: PopoverPositionArea;
    /**
     * Для popover `size` трактуется как ширина.
     * Значение > 1 интерпретируется в px, значение от 0 до 1 — как отношение к ширине якоря.
     */
    size?: number;
    overlays?: Overlay<ServerComponentConfig>[];
  };
} & ServerComponentConfig;
