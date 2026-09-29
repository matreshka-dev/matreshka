import { ServerComponentClass } from "../enums/server-component-class";
import type { OutputConfig } from "./output-config";

export type NumberOutputConfig = {
  class: ServerComponentClass.Number;
} & OutputConfig<number>;
