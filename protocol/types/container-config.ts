import { ServerComponentClass } from "../enums/server-component-class";
import type { ServerComponentConfig } from "./server-component-config";

export type ContainerConfig = {
  class: ServerComponentClass.Container;
  properties: {
    content: ServerComponentConfig[];
  };
} & ServerComponentConfig;
