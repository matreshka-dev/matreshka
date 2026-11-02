import { ServerComponentClass } from "../enums/server-component-class";
import type { OutputConfig } from "./output-config";

export type ProgressBarConfig = {
  class: ServerComponentClass.ProgressBar;
} & OutputConfig<number | undefined>;
