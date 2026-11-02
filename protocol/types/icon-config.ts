import { ServerComponentClass } from "../enums/server-component-class";
import type { OutputConfig } from "./output-config";

export type IconConfig = {
  class: ServerComponentClass.Icon;
  properties: {
    size: number;
  };
} & OutputConfig<string>;
