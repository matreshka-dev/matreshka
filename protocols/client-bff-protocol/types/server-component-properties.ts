import { ColorRole } from "../enums/color-role";
import { TextAlign } from "../enums/text-align";
import { TextDecoration } from "../enums/text-decoration";
import type { Overlay as OverlayShape } from "./container-overlay";
import type { FlexItemSpec } from "./flex-item";
import type { FontStackToken } from "./fonts";
import type { GridItem } from "./grid-item";
import type { RadiusPx } from "./radius-px";

/** Wire-свойства компонента (overlays, colors и т.д.; у entry — через entry-server-component-config). */
export type ServerComponentProperties<TComponent> = {
  overlays?: OverlayShape<TComponent>[];
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
