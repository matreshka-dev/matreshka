import { ServerComponentClass } from "../enums/server-component-class";
import type { OutputConfig } from "./output-config";
import type { TextOutputProcessorConfig } from "./text-output-processor-config";

export type TextOutputConfig = {
  class: ServerComponentClass.Text;
  properties: {
    maxLines?: number;
    processors?: TextOutputProcessorConfig[];
  };
} & OutputConfig<string>;
