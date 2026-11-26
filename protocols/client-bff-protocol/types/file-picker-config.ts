import { ServerComponentClass } from "../enums/server-component-class";
import type { ServerComponentConfig } from "./server-component-config";

export type FilePickerConfig = {
  class: ServerComponentClass.FilePicker;
  properties: {
    multiple: boolean;
    content: ServerComponentConfig[];
    accept?: string;
  };
} & ServerComponentConfig;
