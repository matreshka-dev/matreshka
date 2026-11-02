import { ServerComponentClass } from "../enums/server-component-class";
import type { ServerComponentConfig } from "./server-component-config";

export type ForEachConfig = {
  class: ServerComponentClass.ForEach;
  properties: {
    ref: string;
    components?: (ServerComponentConfig | ServerComponentConfig[])[];
    componentContext: string;
    divider?: ServerComponentConfig[];
  };
} & ServerComponentConfig;
