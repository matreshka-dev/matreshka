import { RatioMode } from "../enums/ratio-mode";
import { ServerComponentClass } from "../enums/server-component-class";
import { VectorMode } from "../enums/vector-mode";
import type { FlexItemSpec } from "./flex-item";
import type { OutputConfig } from "./output-config";

export type VectorConfig = {
  class: ServerComponentClass.Vector;
  properties: {
    mode: VectorMode;
    flexItem?: FlexItemSpec;
    ratio?: {
      value: number;
      mode: RatioMode;
    };
  };
} & OutputConfig<string>;
