import { GridColumnSize } from "../enums/grid-column-size";
import { GridTemplateColumns } from "../enums/grid-template-columns";
import { ServerComponentClass } from "../enums/server-component-class";
import type { FlexItemSpec } from "./flex-item";
import type { GridGap } from "./grid-gap";
import type { ServerComponentConfig } from "./server-component-config";

export type GridConfig = {
  class: ServerComponentClass.Grid;
  properties: {
    content: ServerComponentConfig[];
    gap?: GridGap;
    columns:
      | GridTemplateColumns
      | number
      | { min: number; max: number }
      | (GridColumnSize | number | { min: number; max: number })[];
    surface?: boolean;
    flexItem?: FlexItemSpec;
  };
} & ServerComponentConfig;
