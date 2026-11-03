import { ServerComponentClass } from "../enums/server-component-class";
import type { Condition } from "./condition";
import type { ServerComponentInteraction } from "./server-component-interaction";
import type { ServerComponentProperties } from "./server-component-properties";

export type ServerComponentRule = {
  conditions: Condition[];
  overrides: Record<string, unknown>;
};

export type ServerComponentConfig = {
  id: string;
  class: ServerComponentClass;
  interactions?: Record<string, ServerComponentInteraction[]>;
  conditions?: Condition[];
  rules?: ServerComponentRule[];
  properties?: ServerComponentProperties<ServerComponentConfig>;
};

/** Общие wire-свойства entry (страница, диалог, popover): overlays, colors и т.д. */
export type EntryServerComponentProperties =
  ServerComponentProperties<ServerComponentConfig>;
