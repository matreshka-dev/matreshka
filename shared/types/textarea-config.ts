import { ServerComponentClass } from "../enums/server-component-class";
import { TextareaResize } from "../enums/textarea-resize";
import type { InputConfig } from "./input-config";

export type TextareaConfig = {
  class: ServerComponentClass.Textarea;
  properties: {
    placeholder?: string;
    rows?: number;
    resize?: TextareaResize;
  };
} & InputConfig;
