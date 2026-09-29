import { MapMarkerHorizontalAnchor } from "@matreshka/shared/enums/map-marker-horizontal-anchor";
import { MapMarkerVerticalAnchor } from "@matreshka/shared/enums/map-marker-vertical-anchor";
import { ServerComponentClass } from "@matreshka/shared/enums/server-component-class";
import { MapSetCenterMessage } from "@matreshka/shared/messages/bff-to-client/components/map/map-set-center-message";
import { MapSetZoomMessage } from "@matreshka/shared/messages/bff-to-client/components/map/map-set-zoom-message";
import { MapZoomInMessage } from "@matreshka/shared/messages/bff-to-client/components/map/map-zoom-in-message";
import { MapZoomOutMessage } from "@matreshka/shared/messages/bff-to-client/components/map/map-zoom-out-message";
import {
  normalizeFlexItem,
  type FlexItemSpec,
} from "@matreshka/shared/types/flex-item";
import type { MapConfig } from "@matreshka/shared/types/map-config";
import type { NestedItemBase } from "@matreshka/shared/types/nested-item-base";
import {
  Componentable,
  ComponentInstance,
  ComponentTreeNode,
  serializeOverlays,
  StandaloneComponent,
} from "../core";
import {
  Component,
  ComponentInitConfig,
  ComponentProperties,
  ServerComponentAction,
} from "./component";
import {
  attachItemListsToHost,
  createItemListHostAdapter,
  createNestedItemsSlotState,
  flattenNestedItemsForSerialize,
  wireNestedItemsHostLifecycle,
} from "./item-list";
import { flattenNestedItems } from "./item-list/flatten-nested-items";
import type { ItemList } from "./item-list/item-list";
import type { ItemListHost } from "./item-list/item-list-host";
import { Overlay } from "./types/container-overlay";

export const map = (config: MapInitConfig<Map>): Map => new Map(config);

export type MapMarker = {
  coordinates: {
    latitude: number;
    longitude: number;
  };
  width: number;
  anchor?: {
    vertical?: MapMarkerVerticalAnchor;
    horizontal?: MapMarkerHorizontalAnchor;
  };
  component: ComponentTreeNode;
};

export type MapMarkerEntry = MapMarker | ItemList<any, MapMarker>;

export type MapProperties = {
  apiKey: string;
  center: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  zoom: number;
  overlays?: Overlay[];
  flexItem?: FlexItemSpec;
} & ComponentProperties;

export type MapInitConfig<
  ComponentType extends Componentable = Map,
  PropertiesType extends MapProperties = MapProperties,
> = {
  center: {
    latitude: number;
    longitude: number;
    altitude?: number;
  };
  overlays?: Overlay[];
  apiKey: string;
  zoom?: number;
  flexItem?: FlexItemSpec;
  markers?: MapMarkerEntry[];
  onCenterChange?:
    | ServerComponentAction<
        ComponentType,
        { latitude: number; longitude: number; altitude?: number }
      >
    | ServerComponentAction<
        ComponentType,
        { latitude: number; longitude: number; altitude?: number }
      >[];
  onZoomChange?:
    | ServerComponentAction<ComponentType, number>
    | ServerComponentAction<ComponentType, number>[];
} & ComponentInitConfig<ComponentType, PropertiesType>;

type DefaultInitConfigType = MapInitConfig<Map>;

export class Map<
    InitConfigType extends MapInitConfig<any> = DefaultInitConfigType,
    PropertiesType extends MapProperties = MapProperties,
  >
  extends Component<InitConfigType, PropertiesType>
  implements StandaloneComponent, ItemListHost
{
  private readonly markersSlot = {
    slot: "",
    source: [] as MapMarkerEntry[],
    itemLists: [] as ItemList<any, MapMarker>[],
  };
  private readonly itemListHostAdapter!: ItemListHost;

  setCenter(
    center: {
      latitude: number;
      longitude: number;
      altitude?: number;
    },
    instances?: ComponentInstance[],
  ) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new MapSetCenterMessage(instance.id, center),
          );
        });
    } else {
      this.broadcast(new MapSetCenterMessage(this.id, center));
    }
  }

  setZoom(zoom: number, instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new MapSetZoomMessage(instance.id, zoom),
          );
        });
    } else {
      this.broadcast(new MapSetZoomMessage(this.id, zoom));
    }
  }

  zoomIn(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new MapZoomInMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new MapZoomInMessage(this.id));
    }
  }

  zoomOut(instances?: ComponentInstance[]) {
    if (instances) {
      instances
        .filter((instance) => instance.client)
        .forEach((instance) => {
          instance.client!.outcomingMessage$.next(
            new MapZoomOutMessage(instance.id),
          );
        });
    } else {
      this.broadcast(new MapZoomOutMessage(this.id));
    }
  }

  constructor(config: InitConfigType) {
    const markersSlot = createNestedItemsSlotState<MapMarker>(config.markers);
    wireNestedItemsHostLifecycle(config, markersSlot.itemLists);
    super(config);
    this.markersSlot.source = markersSlot.source;
    this.markersSlot.itemLists = markersSlot.itemLists;
    attachItemListsToHost(this, "markers", this.markersSlot);
    this.itemListHostAdapter = createItemListHostAdapter(
      () => this.instances,
      (slot) => (slot === "markers" ? this.markersSlot : undefined),
    );
    if (config.onCenterChange) {
      const actions = config.onCenterChange as unknown as
        | ServerComponentAction<Componentable, unknown>
        | ServerComponentAction<Componentable, unknown>[];
      this.bindActions("center-change", actions);
    }
    if (config.onZoomChange) {
      const actions = config.onZoomChange as unknown as
        | ServerComponentAction<Componentable, unknown>
        | ServerComponentAction<Componentable, unknown>[];
      this.bindActions("zoom-change", actions);
    }
  }

  get hostInstances(): readonly ComponentInstance[] {
    return this.instances;
  }

  syncNestedItems(slot: string, items: NestedItemBase[]): void {
    this.itemListHostAdapter.syncNestedItems(slot, items);
  }

  resyncNestedSlot(slot: string): void {
    this.itemListHostAdapter.resyncNestedSlot(slot);
  }

  protected class(): ServerComponentClass {
    return ServerComponentClass.Map;
  }

  standalone(): true {
    return true;
  }

  protected initProperties(initValues: InitConfigType): PropertiesType {
    return {
      ...super.initProperties(initValues),
      apiKey: initValues.apiKey,
      center: initValues.center,
      zoom: initValues.zoom ?? 17,
      overlays: initValues.overlays,
      flexItem: normalizeFlexItem(initValues.flexItem),
    };
  }

  protected serializeRuleOverrides(
    overrides: Partial<PropertiesType & { markers?: MapMarkerEntry[] }>,
  ): Record<string, unknown> {
    const out: Record<string, unknown> = { ...overrides };
    if (overrides.overlays !== undefined) {
      out.overlays = serializeOverlays(overrides.overlays);
    }
    if (overrides.markers !== undefined) {
      const instance = this.createInstance();
      out.markers = flattenNestedItems(overrides.markers, instance);
    }
    if (overrides.flexItem !== undefined) {
      out.flexItem = normalizeFlexItem(overrides.flexItem);
    }
    return out;
  }

  serialize(instance?: ComponentInstance<this>): MapConfig {
    if (!instance) {
      instance = this.createInstance();
    }
    const result = super.serialize(instance);
    const p = this.properties;
    const markers = flattenNestedItemsForSerialize(this.markersSlot, instance);
    return {
      ...result,
      class: ServerComponentClass.Map,
      properties: {
        ...p,
        overlays: p.overlays ? serializeOverlays(p.overlays) : [],
        markers,
      },
    };
  }
}

export { itemList } from "./item-list";
