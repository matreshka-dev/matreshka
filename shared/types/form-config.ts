import { ServerComponentClass } from "../enums/server-component-class";
import type { ServerComponentConfig } from "./server-component-config";

export type FormConfig = {
  class: ServerComponentClass.Form;
  properties: {
    content: ServerComponentConfig[];
  };
} & ServerComponentConfig;
