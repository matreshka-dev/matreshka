import { RatioMode } from "../enums/ratio-mode";
import { ServerComponentClass } from "../enums/server-component-class";
import type { FlexItemSpec } from "./flex-item";
import type { OutputConfig } from "./output-config";
import type { RadiusPx } from "./radius-px";

export type ImageOutputConfig = {
  class: ServerComponentClass.Image;
  properties: {
    ratio?: {
      value: number;
      mode: RatioMode;
    };
    radius?: RadiusPx;
    flexItem?: FlexItemSpec;
  };
} & OutputConfig<string>;
