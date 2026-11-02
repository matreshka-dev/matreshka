import { PopoverPositionArea } from "../enums/popover-position-area";
import { ServerComponentClass } from "../enums/server-component-class";
import type { Overlay } from "./container-overlay";
import type { EntryServerComponentConfig } from "./entry-server-component-config";
import type { ServerComponentConfig } from "./server-component-config";
export type PopoverConfig = {
    class: ServerComponentClass.Popover;
    properties: {
        content: ServerComponentConfig[];
        positionArea?: PopoverPositionArea;
        size?: number;
        overlays?: Overlay<ServerComponentConfig>[];
    };
} & EntryServerComponentConfig;
