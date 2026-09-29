import { ServerComponentClass } from "../enums/server-component-class";
import type { Overlay } from "./container-overlay";
import type { FlexItemSpec } from "./flex-item";
import type { NestedItemBase } from "./nested-item-base";
import type { ServerComponentConfig } from "./server-component-config";

export type BoardPoint = {
  x: number;
  y: number;
};

export type BoardItemConfig = {
  position: BoardPoint;
  component: ServerComponentConfig;
};

export type SerializedBoardItem = BoardItemConfig & NestedItemBase;

export type BoardConfig = {
  class: ServerComponentClass.Board;
  properties: {
    center: BoardPoint;
    zoom: number;
    minZoom: number;
    maxZoom: number;
    zoomStep: number;
    flexItem?: FlexItemSpec;
    overlays?: Overlay<ServerComponentConfig>[];
    items?: SerializedBoardItem[];
  };
} & ServerComponentConfig;
