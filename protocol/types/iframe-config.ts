import { IframeAllow } from "../enums/iframe-allow";
import { ServerComponentClass } from "../enums/server-component-class";
import type { OutputConfig } from "./output-config";

export type IframeConfig = {
  class: ServerComponentClass.Iframe;
  properties: {
    allow?: IframeAllow[];
    ratio?: {
      value: number;
    };
  };
} & OutputConfig<string>;
