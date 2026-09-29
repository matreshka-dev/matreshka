import { FlexWrap } from "../enums/flex-wrap";
import { ComponentOutline } from "../enums/outline-type";
import { Overflow } from "../enums/overflow";
import { SafeAreaSide } from "../enums/safe-area-side";
import { ServerComponentClass } from "../enums/server-component-class";
import { StackCrossAxisAlign, StackMainAxisAlign } from "../enums/stack-align";
import { StackDirection } from "../enums/stack-direction";
import type { Overlay } from "./container-overlay";
import type { FlexItemSpec } from "./flex-item";
import type { PaddingPx } from "./padding-px";
import type { RadiusPx } from "./radius-px";
import type { ServerComponentConfig } from "./server-component-config";

export type StackConfig = {
  class: ServerComponentClass.Stack;
  properties: {
    overlays?: Overlay<ServerComponentConfig>[];
    align?: {
      main?: StackMainAxisAlign;
      cross?: StackCrossAxisAlign;
    };
    direction?: StackDirection;
    gap?: number;
    overflow?: Overflow;
    wrap?: FlexWrap;
    flexItem?: FlexItemSpec;
    content: ServerComponentConfig[];
    padding?: PaddingPx;
    safeArea?: SafeAreaSide[];
    radius?: RadiusPx;
    surface?: boolean;
    outline?: ComponentOutline[];
    focusWithinStyle?: boolean;
    disabled?: boolean;
  };
} & ServerComponentConfig;
