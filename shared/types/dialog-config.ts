import { ServerComponentClass } from "../enums/server-component-class";
import type { Overlay, OverlayAnchor } from "./container-overlay";
import type { DialogBackdropConfig } from "./dialog-backdrop-config";
import type { ServerComponentConfig } from "./server-component-config";

export type DialogConfig = {
  class: ServerComponentClass.Dialog;
  properties: {
    content: ServerComponentConfig[];
    anchors?: [OverlayAnchor, ...OverlayAnchor[]];
    modal?: boolean;
    overlays?: Overlay<ServerComponentConfig>[];
    backdrop?: DialogBackdropConfig;
  };
} & ServerComponentConfig;
