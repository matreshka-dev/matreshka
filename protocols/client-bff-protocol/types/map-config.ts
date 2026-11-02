import { MapMarkerHorizontalAnchor } from "../enums/map-marker-horizontal-anchor";
import { MapMarkerVerticalAnchor } from "../enums/map-marker-vertical-anchor";
import { ServerComponentClass } from "../enums/server-component-class";
import type { Overlay } from "./container-overlay";
import type { NestedItemBase } from "./nested-item-base";
import type { ServerComponentConfig } from "./server-component-config";

export type MapMarkerConfig = {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  width: number;
  component: ServerComponentConfig;
  anchor?: {
    vertical?: MapMarkerVerticalAnchor;
    horizontal?: MapMarkerHorizontalAnchor;
  };
};

export type SerializedMapMarker = MapMarkerConfig & NestedItemBase;

export type MapConfig = {
  class: ServerComponentClass.Map;
  properties: {
    apiKey: string;
    overlays?: Overlay<ServerComponentConfig>[];
    markers?: SerializedMapMarker[];
    center: {
      latitude: number;
      longitude: number;
      /** Высота над эллипсоидом WGS84, м (опционально, Yandex Maps API v3). */
      altitude?: number;
    };
    zoom: number;
  };
} & ServerComponentConfig;
