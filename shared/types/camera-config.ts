import { ServerComponentClass } from "../enums/server-component-class";
import { VideoFacingMode } from "../enums/video-facing-mode";
import type { Overlay } from "./container-overlay";
import type { ServerComponentConfig } from "./server-component-config";

export type CameraConfig = {
  class: ServerComponentClass.Camera;
  properties: {
    overlays?: Overlay<ServerComponentConfig>[];
    content: ServerComponentConfig[];
    facingMode?: VideoFacingMode;
  };
} & ServerComponentConfig;
