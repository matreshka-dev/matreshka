import type { ServerComponentConfig } from "./server-component-config";

/** Общая форма элемента nested-slot на wire (map markers, board items). */
export type NestedItemBase = {
  id: string;
  component: ServerComponentConfig;
};
