import { ServerComponentClass } from "../enums/server-component-class";
import type { EntryServerComponentConfig } from "./entry-server-component-config";
import type {
  EntryServerComponentProperties,
  ServerComponentConfig,
} from "./server-component-config";

export interface PageConfigProperties extends EntryServerComponentProperties {
  title: string;
  content: ServerComponentConfig[];
  statusCode: number;
}

export type PageConfig = Omit<
  EntryServerComponentConfig,
  "class" | "properties"
> & {
  class: ServerComponentClass.Page;
  properties: PageConfigProperties;
};
