import { ServerComponentClass } from "../enums/server-component-class";
import type { Overlay } from "./container-overlay";
import type { ServerComponentConfig } from "./server-component-config";

export type PageConfig = {
  class: ServerComponentClass.Page;
  properties: {
    title: string;
    content: ServerComponentConfig[];
    overlays?: Overlay<ServerComponentConfig>[];
    statusCode: number;
  };
} & ServerComponentConfig;
