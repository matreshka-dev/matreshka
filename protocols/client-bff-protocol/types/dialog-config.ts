import { ServerComponentClass } from "../enums/server-component-class";
import type { OverlayAnchor } from "./container-overlay";
import type { DialogBackdropConfig } from "./dialog-backdrop-config";
import type { EntryServerComponentConfig } from "./entry-server-component-config";
import type {
  EntryServerComponentProperties,
  ServerComponentConfig,
} from "./server-component-config";

export interface DialogConfigProperties extends EntryServerComponentProperties {
  content: ServerComponentConfig[];
  anchors?: [OverlayAnchor, ...OverlayAnchor[]];
  modal?: boolean;
  backdrop?: DialogBackdropConfig;
}

export type DialogConfig = Omit<
  EntryServerComponentConfig,
  "class" | "properties"
> & {
  class: ServerComponentClass.Dialog;
  properties: DialogConfigProperties;
};
