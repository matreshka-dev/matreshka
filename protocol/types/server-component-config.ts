import { ColorRole } from "../enums/color-role";
import { ServerComponentClass } from "../enums/server-component-class";
import { TextAlign } from "../enums/text-align";
import { TextDecoration } from "../enums/text-decoration";
import type { Condition } from "./condition";
import type { Overlay as OverlayShape } from "./container-overlay";
import type { FlexItemSpec } from "./flex-item";
import type { FontStackToken } from "./fonts";
import type { GridItem } from "./grid-item";
import type { RadiusPx } from "./radius-px";
import type { ServerComponentInteraction } from "./server-component-interaction";

export type ServerComponentRule = {
  conditions: Condition[];
  overrides: Record<string, unknown>;
};

export type ServerComponentConfig = {
  id: string;
  class: ServerComponentClass;
  interactions?: Record<string, ServerComponentInteraction[]>;
  conditions?: Condition[];
  rules?: ServerComponentRule[];
  properties?: {
    overlays?: OverlayShape<ServerComponentConfig>[];
    colors?: Partial<Record<ColorRole, string>>;
    font?: FontStackToken;
    size?: number;
    flexItem?: FlexItemSpec;
    scale?: number;
    textAlign?: TextAlign;
    textDecoration?: TextDecoration;
    link?: {
      value: string;
    };
    radius?: RadiusPx;
    /** Настройки размещения элемента, когда он находится внутри grid. */
    gridItem?: GridItem;
  } & Record<string, unknown>;
};
