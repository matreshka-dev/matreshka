import { ServerComponentClass } from "../enums/server-component-class";
import type { ServerComponentConfig } from "./server-component-config";

export type FileUploadAreaConfig = {
  class: ServerComponentClass.FileUploadArea;
  properties: {
    multiple: boolean;
    content: ServerComponentConfig[];
    url: string;
    accept?: string;
  };
} & ServerComponentConfig;
