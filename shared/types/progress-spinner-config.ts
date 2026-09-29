import { ServerComponentClass } from "../enums/server-component-class";
import type { OutputConfig } from "./output-config";

export type ProgressSpinnerConfig = {
  class: ServerComponentClass.ProgressSpinner;
  properties: {
    background?: boolean;
  };
} & OutputConfig<number | undefined>;
